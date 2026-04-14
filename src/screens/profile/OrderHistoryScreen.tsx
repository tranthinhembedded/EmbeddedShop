import React, {useMemo, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {
  Order,
  ORDER_CANCELLATION_REASONS,
  PRODUCT_INDEX,
  type OrderCancellationReason,
  isCancellableOrderStatus,
} from '../../catalog';
import {HardwareGlyph} from '../../components/HardwareGlyph';
import {useAppAlert} from '../../components/common/AppAlertProvider';
import type {RootStackParamList} from '../../navigation/types';
import {useShopApp} from '../../store/shopAppContext';
import {
  CONTROL_ROOM_THEME,
  WORKBENCH_THEME,
  type ThemeTokens,
} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>;
type OrderStatusFilter = 'all' | Order['status'];
const CANCELLATION_REVIEW_TONE = '#FF7A98';

const STATUS_FILTERS: Array<{id: OrderStatusFilter; label: string}> = [
  {id: 'all', label: 'All'},
  {id: 'Processing', label: 'Processing'},
  {id: 'Ready to ship', label: 'Ready'},
  {id: 'Delivered', label: 'Delivered'},
  {id: 'Awaiting payment', label: 'Awaiting'},
  {id: 'Cancellation review pending', label: 'Cancel review'},
];

const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  Delivered: '#5BCB7F',
  Processing: '#FFBA49',
  'Ready to ship': '#41D7FF',
  'Awaiting payment': '#FF6B7C',
  'Cancellation review pending': CANCELLATION_REVIEW_TONE,
};

const TRACK_STEPS = [
  {
    id: 'awaiting-payment',
    label: 'Payment gate',
    description: 'Order registered in the procurement console.',
  },
  {
    id: 'processing',
    label: 'Bench prep',
    description: 'Modules are being picked and checked.',
  },
  {
    id: 'ready-to-ship',
    label: 'Dispatch queue',
    description: 'Packing complete and waiting for carrier handoff.',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Shipment reached the destination contact.',
  },
] as const;

const alpha = (hex: string, value: number) => {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map(character => character + character)
          .join('')
      : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const getTrackStepIndex = (order: Order) => {
  const status =
    order.status === 'Cancellation review pending'
      ? order.cancelRequest?.previousStatus ?? 'Processing'
      : order.status;

  switch (status) {
    case 'Awaiting payment':
      return 0;
    case 'Processing':
      return 1;
    case 'Ready to ship':
      return 2;
    case 'Delivered':
      return 3;
    default:
      return 0;
  }
};

const canRequestCancellation = (order: Order) =>
  isCancellableOrderStatus(order.status);

function TrackOrderModal({
  order,
  theme,
  onClose,
}: {
  order: Order | null;
  theme: ThemeTokens;
  onClose: () => void;
}): React.JSX.Element | null {
  if (!order) {
    return null;
  }

  const activeIndex = getTrackStepIndex(order);
  const tone = ORDER_STATUS_COLORS[order.status];
  const cancelRequest =
    order.status === 'Cancellation review pending'
      ? order.cancelRequest ?? null
      : null;
  const cancellationPending = cancelRequest !== null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, {backgroundColor: alpha(theme.bg, 0.84)}]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.surface,
              borderColor: alpha(tone, 0.32),
              shadowColor: tone,
            },
          ]}>
          <Text style={[styles.modalEyebrow, {color: tone}]}>TRACK ORDER</Text>
          <Text style={[styles.modalTitle, {color: theme.text}]}>{order.id}</Text>
          <Text style={[styles.modalBody, {color: theme.textMuted}]}>
            {cancellationPending
              ? 'A cancellation request has been submitted and is waiting for team review before fulfillment can be stopped.'
              : `Current status: ${order.status}. This prototype simulates live tracking milestones for the shipment.`}
          </Text>

          {cancellationPending ? (
            <View
              style={[
                styles.noticeCard,
                styles.modalNoticeCard,
                {
                  backgroundColor: alpha(tone, 0.08),
                  borderColor: alpha(tone, 0.28),
                },
              ]}>
              <Text style={[styles.noticeTitle, {color: tone}]}>
                Cancellation review pending
              </Text>
              <Text style={[styles.noticeBody, {color: theme.textMuted}]}>
                Reason: {cancelRequest.reason}
              </Text>
              <Text style={[styles.noticeBody, {color: theme.textMuted}]}>
                Requested: {formatDateTime(cancelRequest.requestedAt)}
              </Text>
              <Text style={[styles.noticeBody, {color: theme.textMuted}]}>
                Last fulfillment stage: {cancelRequest.previousStatus}
              </Text>
            </View>
          ) : null}

          <View style={styles.trackTimeline}>
            {TRACK_STEPS.map((step, index) => {
              const active = index === activeIndex;
              const completed = index < activeIndex;

              return (
                <View key={step.id} style={styles.trackStepRow}>
                  <View style={styles.trackRailWrap}>
                    <View
                      style={[
                        styles.trackDot,
                        {
                          backgroundColor:
                            active || completed
                              ? alpha(tone, active ? 0.18 : 0.12)
                              : alpha(theme.panelAlt, 0.96),
                          borderColor:
                            active || completed
                              ? alpha(tone, 0.34)
                              : alpha(theme.border, 0.92),
                        },
                      ]}>
                      <View
                        style={[
                          styles.trackDotCore,
                          !(active || completed) ? styles.trackDotCoreMuted : null,
                          {
                            backgroundColor:
                              active || completed ? tone : theme.textMuted,
                          },
                        ]}
                      />
                    </View>
                    {index < TRACK_STEPS.length - 1 ? (
                      <View
                        style={[
                          styles.trackLine,
                          {
                            backgroundColor:
                              index < activeIndex
                                ? alpha(tone, 0.42)
                                : alpha(theme.border, 0.92),
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.trackContent}>
                    <Text
                      style={[
                        styles.trackLabel,
                        {color: active ? theme.text : theme.textMuted},
                      ]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.trackDescription, {color: theme.textMuted}]}>
                      {step.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={[styles.modalPrimaryButton, {backgroundColor: tone}]}>
            <Text style={styles.modalPrimaryLabel}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CancelOrderModal({
  order,
  selectedReason,
  theme,
  onClose,
  onSelectReason,
  onSubmit,
}: {
  order: Order | null;
  selectedReason: OrderCancellationReason;
  theme: ThemeTokens;
  onClose: () => void;
  onSelectReason: (reason: OrderCancellationReason) => void;
  onSubmit: () => void;
}): React.JSX.Element | null {
  if (!order) {
    return null;
  }

  const tone = CANCELLATION_REVIEW_TONE;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, {backgroundColor: alpha(theme.bg, 0.84)}]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.surface,
              borderColor: alpha(tone, 0.32),
              shadowColor: tone,
            },
          ]}>
          <Text style={[styles.modalEyebrow, {color: tone}]}>CANCEL REQUEST</Text>
          <Text style={[styles.modalTitle, {color: theme.text}]}>{order.id}</Text>
          <Text style={[styles.modalBody, {color: theme.textMuted}]}>
            Choose the reason for cancelling this order. The status will move to
            cancellation review pending until the request is checked.
          </Text>

          <View style={styles.reasonList}>
            {ORDER_CANCELLATION_REASONS.map(reason => {
              const selected = reason === selectedReason;

              return (
                <Pressable
                  key={reason}
                  onPress={() => onSelectReason(reason)}
                  style={[
                    styles.reasonOption,
                    {
                      backgroundColor: selected
                        ? alpha(tone, 0.12)
                        : alpha(theme.panelAlt, 0.92),
                      borderColor: selected
                        ? alpha(tone, 0.32)
                        : alpha(theme.border, 0.92),
                    },
                  ]}>
                  <View
                    style={[
                      styles.reasonOptionMarker,
                      selected ? styles.reasonOptionMarkerSelected : null,
                    ]}>
                    {selected ? (
                      <View
                        style={[
                          styles.reasonOptionMarkerCore,
                          {backgroundColor: tone},
                        ]}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.reasonOptionLabel,
                      {color: selected ? theme.text : theme.textMuted},
                    ]}>
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalActionRow}>
            <Pressable
              onPress={onClose}
              style={[
                styles.modalSecondaryButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.modalSecondaryLabel, {color: theme.text}]}>
                Back
              </Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              style={[
                styles.modalPrimaryButton,
                styles.modalActionButton,
                {backgroundColor: tone},
              ]}>
              <Text style={styles.modalPrimaryLabel}>Send request</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function OrderHistoryScreen({
  navigation,
}: Props): React.JSX.Element {
  const {dark, orders, requestOrderCancellation} = useShopApp();
  const {showAlert} = useAppAlert();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<OrderCancellationReason>(
    ORDER_CANCELLATION_REASONS[0],
  );

  const selectedOrder =
    orders.find(order => order.id === selectedOrderId) ?? null;
  const trackingOrder =
    orders.find(order => order.id === trackingOrderId) ?? null;
  const cancelOrder =
    orders.find(order => order.id === cancelOrderId) ?? null;

  const filteredOrders = useMemo(
    () =>
      statusFilter === 'all'
        ? orders
        : orders.filter(order => order.status === statusFilter),
    [orders, statusFilter],
  );

  const openCancelRequest = (orderId: string) => {
    setCancelReason(ORDER_CANCELLATION_REASONS[0]);
    setCancelOrderId(orderId);
  };

  const closeCancelRequest = () => setCancelOrderId(null);

  const submitCancelRequest = () => {
    if (!cancelOrder) {
      closeCancelRequest();
      showAlert({
        tone: 'warning',
        eyebrow: 'ORDER STATUS',
        title: 'Order not found',
        message: 'This order could not be loaded anymore.',
      });
      return;
    }

    const result = requestOrderCancellation(cancelOrder.id, cancelReason);

    if (!result.success) {
      closeCancelRequest();
      showAlert({
        tone: 'warning',
        eyebrow: 'REQUEST BLOCKED',
        title:
          result.reason === 'not-cancellable'
            ? 'Unable to send request'
            : 'Order not found',
        message:
          result.reason === 'not-cancellable'
            ? 'This order can no longer be submitted for cancellation.'
            : 'This order could not be loaded anymore.',
      });
      return;
    }

    closeCancelRequest();
    showAlert({
      tone: 'success',
      eyebrow: 'REQUEST SENT',
      title: 'Cancellation request sent',
      message: `Order ${cancelOrder.id} is now pending cancellation review.`,
      code: cancelOrder.id,
      codeLabel: 'ORDER ID',
    });
  };

  if (selectedOrder) {
    return (
      <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
        <View style={styles.screen}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => setSelectedOrderId(null)}
              style={[
                styles.backButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.backButtonLabel, {color: theme.text}]}>Back</Text>
            </Pressable>
            <View style={styles.flexFill}>
              <Text style={[styles.eyebrow, {color: theme.accent}]}>
                ORDER DETAIL
              </Text>
              <Text style={[styles.title, {color: theme.text}]}>
                {selectedOrder.id}
              </Text>
              <Text style={[styles.subtitle, {color: theme.textMuted}]}>
                Review ordered modules, status, and simulated tracking details.
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.surfaceCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <View style={styles.rowSpace}>
                <View style={styles.flexFill}>
                  <Text style={[styles.eyebrow, {color: theme.accent}]}>STATUS</Text>
                  <Text style={[styles.summaryValue, {color: theme.text}]}>
                    {selectedOrder.status}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: alpha(
                        ORDER_STATUS_COLORS[selectedOrder.status],
                        0.12,
                      ),
                      borderColor: alpha(
                        ORDER_STATUS_COLORS[selectedOrder.status],
                        0.3,
                      ),
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusPillLabel,
                      {color: ORDER_STATUS_COLORS[selectedOrder.status]},
                    ]}>
                    {selectedOrder.status}
                  </Text>
                </View>
              </View>
              <View style={styles.orderMetaGrid}>
                <View style={styles.orderMetaCell}>
                  <Text style={[styles.metaLabel, {color: theme.textMuted}]}>
                    Date
                  </Text>
                  <Text style={[styles.metaValue, {color: theme.text}]}>
                    {selectedOrder.date}
                  </Text>
                </View>
                <View style={styles.orderMetaCell}>
                  <Text style={[styles.metaLabel, {color: theme.textMuted}]}>
                    Items
                  </Text>
                  <Text style={[styles.metaValue, {color: theme.text}]}>
                    {selectedOrder.items}
                  </Text>
                </View>
                <View style={styles.orderMetaCell}>
                  <Text style={[styles.metaLabel, {color: theme.textMuted}]}>
                    Total
                  </Text>
                  <Text style={[styles.metaValue, {color: theme.lime}]}>
                    {formatPrice(selectedOrder.total)}
                  </Text>
                </View>
              </View>

              {selectedOrder.cancelRequest ? (
                <View
                  style={[
                    styles.noticeCard,
                    {
                      backgroundColor: alpha(
                        ORDER_STATUS_COLORS['Cancellation review pending'],
                        0.08,
                      ),
                      borderColor: alpha(
                        ORDER_STATUS_COLORS['Cancellation review pending'],
                        0.28,
                      ),
                    },
                  ]}>
                  <Text
                    style={[
                      styles.noticeTitle,
                      {
                        color:
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                      },
                    ]}>
                    Cancellation request submitted
                  </Text>
                  <Text style={[styles.noticeBody, {color: theme.textMuted}]}>
                    Reason: {selectedOrder.cancelRequest.reason}
                  </Text>
                  <Text style={[styles.noticeBody, {color: theme.textMuted}]}>
                    Requested: {formatDateTime(selectedOrder.cancelRequest.requestedAt)}
                  </Text>
                </View>
              ) : null}

              {canRequestCancellation(selectedOrder) ? (
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => setTrackingOrderId(selectedOrder.id)}
                    style={[
                      styles.secondaryButton,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
                      Track order
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openCancelRequest(selectedOrder.id)}
                    style={[
                      styles.dangerButton,
                      {
                        backgroundColor: alpha(
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                          0.12,
                        ),
                        borderColor: alpha(
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                          0.28,
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dangerButtonLabel,
                        {
                          color:
                            ORDER_STATUS_COLORS['Cancellation review pending'],
                        },
                      ]}>
                      Request cancel
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setTrackingOrderId(selectedOrder.id)}
                  style={[
                    styles.primaryButton,
                    {backgroundColor: theme.accent},
                  ]}>
                  <Text style={styles.primaryButtonLabel}>Track order</Text>
                </Pressable>
              )}
            </View>

            <View
              style={[
                styles.surfaceCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <View style={styles.rowSpace}>
                <Text style={[styles.sectionTitle, {color: theme.text}]}>
                  Modules in this order
                </Text>
                <Text style={[styles.metaLabel, {color: theme.textMuted}]}>
                  {selectedOrder.lineItems.length} lines
                </Text>
              </View>
              {selectedOrder.lineItems.map(lineItem => {
                const product = PRODUCT_INDEX[lineItem.productId];

                return (
                  <View
                    key={`${selectedOrder.id}-${product.id}`}
                    style={[
                      styles.lineItemCard,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <View
                      style={[
                        styles.lineItemMedia,
                        {backgroundColor: alpha(product.accent, 0.08)},
                      ]}>
                      <HardwareGlyph product={product} theme={theme} size={82} />
                    </View>
                    <View style={styles.flexFill}>
                      <Text style={[styles.itemVendor, {color: theme.textMuted}]}>
                        {product.vendor}
                      </Text>
                      <Text style={[styles.itemTitle, {color: theme.text}]}>
                        {product.name}
                      </Text>
                      <Text style={[styles.itemMeta, {color: theme.textMuted}]}>
                        Qty {lineItem.quantity} • {product.leadTime}
                      </Text>
                    </View>
                    <Text style={[styles.itemPrice, {color: theme.lime}]}>
                      {formatPrice(product.price * lineItem.quantity)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <TrackOrderModal
          order={trackingOrder}
          theme={theme}
          onClose={() => setTrackingOrderId(null)}
        />
        <CancelOrderModal
          order={cancelOrder}
          selectedReason={cancelReason}
          theme={theme}
          onClose={closeCancelRequest}
          onSelectReason={setCancelReason}
          onSubmit={submitCancelRequest}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.backButtonLabel, {color: theme.text}]}>Back</Text>
          </Pressable>
          <View style={styles.flexFill}>
            <Text style={[styles.eyebrow, {color: theme.accent}]}>
              ORDER HISTORY
            </Text>
            <Text style={[styles.title, {color: theme.text}]}>Procurement log</Text>
            <Text style={[styles.subtitle, {color: theme.textMuted}]}>
              Review processed orders, filter by status, and inspect each shipment.
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.filterRow}>
            {STATUS_FILTERS.map(filter => {
              const selected = statusFilter === filter.id;

              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setStatusFilter(filter.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected
                        ? alpha(theme.accent, 0.14)
                        : alpha(theme.panelAlt, 0.92),
                      borderColor: selected
                        ? alpha(theme.accent, 0.34)
                        : alpha(theme.border, 0.92),
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterChipLabel,
                      {color: selected ? theme.text : theme.textMuted},
                    ]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filteredOrders.length ? (
            filteredOrders.map(order => (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: alpha(theme.border, 0.92),
                  },
                ]}>
                <View style={styles.rowSpace}>
                  <View style={styles.flexFill}>
                    <Text style={[styles.orderNumber, {color: theme.text}]}>
                      {order.id}
                    </Text>
                    <Text style={[styles.orderMetaText, {color: theme.textMuted}]}>
                      {order.date} • {order.items} items
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: alpha(
                          ORDER_STATUS_COLORS[order.status],
                          0.12,
                        ),
                        borderColor: alpha(
                          ORDER_STATUS_COLORS[order.status],
                          0.3,
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusPillLabel,
                        {color: ORDER_STATUS_COLORS[order.status]},
                      ]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderMetricsRow}>
                  <View style={styles.orderMetric}>
                    <Text style={[styles.metaLabel, {color: theme.textMuted}]}>
                      Total amount
                    </Text>
                    <Text style={[styles.metricValue, {color: theme.lime}]}>
                      {formatPrice(order.total)}
                    </Text>
                  </View>
                  <View style={styles.orderMetric}>
                    <Text style={[styles.metaLabel, {color: theme.textMuted}]}>
                      Items count
                    </Text>
                    <Text style={[styles.metricValue, {color: theme.text}]}>
                      {order.items}
                    </Text>
                  </View>
                </View>

                {order.cancelRequest ? (
                  <View
                    style={[
                      styles.noticeCard,
                      {
                        backgroundColor: alpha(
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                          0.08,
                        ),
                        borderColor: alpha(
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                          0.28,
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.noticeTitle,
                        {
                          color:
                            ORDER_STATUS_COLORS['Cancellation review pending'],
                        },
                      ]}>
                      Cancellation request pending
                    </Text>
                    <Text style={[styles.noticeBody, {color: theme.textMuted}]}>
                      Reason: {order.cancelRequest.reason}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => setTrackingOrderId(order.id)}
                    style={[
                      styles.secondaryButton,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
                      Track
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedOrderId(order.id)}
                    style={[
                      styles.primaryButton,
                      {backgroundColor: theme.accent},
                    ]}>
                    <Text style={styles.primaryButtonLabel}>Details</Text>
                  </Pressable>
                </View>

                {canRequestCancellation(order) ? (
                  <Pressable
                    onPress={() => openCancelRequest(order.id)}
                    style={[
                      styles.inlineActionButton,
                      {
                        backgroundColor: alpha(
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                          0.12,
                        ),
                        borderColor: alpha(
                          ORDER_STATUS_COLORS['Cancellation review pending'],
                          0.28,
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.inlineActionButtonLabel,
                        {
                          color:
                            ORDER_STATUS_COLORS['Cancellation review pending'],
                        },
                      ]}>
                      Request cancellation
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.sectionTitle, {color: theme.text}]}>
                No orders in this filter
              </Text>
              <Text style={[styles.subtitle, {color: theme.textMuted}]}>
                Switch the status filter to inspect a different set of shipments.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <TrackOrderModal
        order={trackingOrder}
        theme={theme}
        onClose={() => setTrackingOrderId(null)}
      />
      <CancelOrderModal
        order={cancelOrder}
        selectedReason={cancelReason}
        theme={theme}
        onClose={closeCancelRequest}
        onSelectReason={setCancelReason}
        onSubmit={submitCancelRequest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  screen: {flex: 1, paddingHorizontal: 16, paddingTop: 12},
  flexFill: {flex: 1},
  headerRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  backButton: {
    minWidth: 76,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLabel: {fontSize: 14, fontWeight: '700'},
  eyebrow: {fontSize: 12, fontWeight: '800', letterSpacing: 2},
  title: {fontSize: 32, lineHeight: 38, fontWeight: '800', marginTop: 4},
  subtitle: {fontSize: 15, lineHeight: 22, marginTop: 6},
  scrollContent: {paddingTop: 16, paddingBottom: 32},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14},
  filterChip: {
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipLabel: {fontSize: 13, fontWeight: '800'},
  orderCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  rowSpace: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderNumber: {fontSize: 22, lineHeight: 28, fontWeight: '800'},
  orderMetaText: {fontSize: 13, lineHeight: 19, marginTop: 5},
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 0.8},
  orderMetricsRow: {flexDirection: 'row', gap: 12, marginTop: 18},
  orderMetric: {flex: 1},
  metaLabel: {fontSize: 11, fontWeight: '800', letterSpacing: 1.2},
  metaValue: {fontSize: 15, lineHeight: 20, fontWeight: '800', marginTop: 6},
  metricValue: {fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 6},
  actionRow: {flexDirection: 'row', gap: 12, marginTop: 18},
  noticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 18,
  },
  noticeTitle: {fontSize: 13, lineHeight: 18, fontWeight: '900'},
  noticeBody: {fontSize: 13, lineHeight: 19, marginTop: 4},
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {color: '#041019', fontSize: 16, fontWeight: '900'},
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {fontSize: 16, fontWeight: '800'},
  dangerButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonLabel: {fontSize: 15, fontWeight: '900'},
  inlineActionButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  inlineActionButtonLabel: {fontSize: 14, fontWeight: '900'},
  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  surfaceCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  summaryValue: {fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 6},
  orderMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    marginBottom: 18,
  },
  orderMetaCell: {minWidth: '30%', flexGrow: 1},
  sectionTitle: {fontSize: 20, lineHeight: 26, fontWeight: '800'},
  lineItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  lineItemMedia: {
    width: 92,
    height: 92,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemVendor: {fontSize: 11, fontWeight: '800', letterSpacing: 1.1},
  itemTitle: {fontSize: 16, lineHeight: 21, fontWeight: '800', marginTop: 5},
  itemMeta: {fontSize: 12, lineHeight: 18, marginTop: 6},
  itemPrice: {fontSize: 14, lineHeight: 20, fontWeight: '900'},
  modalBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    shadowOffset: {width: 0, height: 18},
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  modalEyebrow: {fontSize: 12, fontWeight: '900', letterSpacing: 1.8},
  modalTitle: {fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 6},
  modalBody: {fontSize: 15, lineHeight: 23, marginTop: 14},
  modalNoticeCard: {marginTop: 18, marginBottom: 4},
  modalActionRow: {flexDirection: 'row', gap: 12, marginTop: 18},
  modalActionButton: {flex: 1, marginTop: 0},
  modalSecondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryLabel: {fontSize: 16, fontWeight: '800'},
  reasonList: {marginTop: 18, gap: 10},
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  reasonOptionMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(94, 111, 124, 0.92)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonOptionMarkerSelected: {
    borderColor: 'rgba(255, 122, 152, 0.5)',
    backgroundColor: 'rgba(255, 122, 152, 0.16)',
  },
  reasonOptionMarkerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonOptionLabel: {flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '800'},
  trackTimeline: {marginTop: 22},
  trackStepRow: {flexDirection: 'row', gap: 12},
  trackRailWrap: {alignItems: 'center'},
  trackDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDotCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trackDotCoreMuted: {opacity: 0.35},
  trackLine: {
    width: 2,
    height: 42,
    marginVertical: 4,
  },
  trackContent: {flex: 1, paddingBottom: 14},
  trackLabel: {fontSize: 16, lineHeight: 22, fontWeight: '800'},
  trackDescription: {fontSize: 13, lineHeight: 18, marginTop: 4},
  modalPrimaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalPrimaryLabel: {color: '#041019', fontSize: 17, fontWeight: '900'},
});
