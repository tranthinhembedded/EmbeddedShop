import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Camera,
  type CameraPermissionStatus,
  type PhotoFile,
  useCameraDevice,
} from 'react-native-vision-camera';
import {launchImageLibrary, type Asset as ImageLibraryAsset} from 'react-native-image-picker';

import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';
import {AppIcon} from '../AppIcon';

export type SearchImageAsset = {
  id: string;
  uri: string;
  fileName: string;
  width?: number;
  height?: number;
  fileSize?: number;
  source: 'camera' | 'library';
  createdAt: string;
};

type Props = {
  visible: boolean;
  recentImages: SearchImageAsset[];
  onClose: () => void;
  onSelectImage: (asset: SearchImageAsset) => void;
};

const alpha = (hex: string, value: number) => {
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map(character => `${character}${character}`)
          .join('')
      : clean;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

const ensureUri = (value: string) => {
  if (
    value.startsWith('file://') ||
    value.startsWith('content://') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  return `file://${value}`;
};

const pickFileName = (value: string) => {
  const parts = value.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? `search-image-${Date.now()}.jpg`;
};

const formatBytes = (value?: number) => {
  if (!value) {
    return null;
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
};

const buildCameraAsset = (photo: PhotoFile): SearchImageAsset => {
  const fileName = pickFileName(photo.path);

  return {
    id: `camera-${Date.now()}`,
    uri: ensureUri(photo.path),
    fileName,
    width: photo.width,
    height: photo.height,
    source: 'camera',
    createdAt: new Date().toISOString(),
  };
};

const buildLibraryAsset = (
  asset?: ImageLibraryAsset,
): SearchImageAsset | null => {
  if (!asset?.uri) {
    return null;
  }

  return {
    id: asset.id ?? `library-${Date.now()}`,
    uri: ensureUri(asset.uri),
    fileName: asset.fileName ?? pickFileName(asset.uri),
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
    source: 'library',
    createdAt: asset.timestamp ?? new Date().toISOString(),
  };
};

function EmptyLibraryState({
  onPress,
  accent,
  textColor,
  mutedColor,
}: {
  onPress: () => void;
  accent: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.emptyLibraryCard,
        {
          borderColor: alpha(accent, 0.22),
          backgroundColor: alpha(accent, 0.06),
        },
      ]}>
      <View
        style={[
          styles.emptyLibraryGlyph,
          {backgroundColor: alpha(accent, 0.12)},
        ]}>
        <AppIcon name="image" size={18} color={accent} />
      </View>
      <Text style={[styles.emptyLibraryTitle, {color: textColor}]}>
        Add a photo from your library
      </Text>
      <Text style={[styles.emptyLibraryBody, {color: mutedColor}]}>
        Use an existing product photo when you do not want to shoot a new one.
      </Text>
      <Text style={[styles.emptyLibraryAction, {color: accent}]}>
        Browse library
      </Text>
    </Pressable>
  );
}

export default function SearchCameraModal({
  visible,
  recentImages,
  onClose,
  onSelectImage,
}: Props): React.JSX.Element {
  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>(
    () => Camera.getCameraPermissionStatus(),
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPickingFromLibrary, setIsPickingFromLibrary] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<SearchImageAsset | null>(null);

  const activeDevice = cameraPosition === 'front' ? frontDevice : device;
  const recentImageList = useMemo(() => recentImages.slice(0, 6), [recentImages]);
  const previewMeta = useMemo(() => {
    if (!previewAsset) {
      return null;
    }

    const parts = [`${previewAsset.source === 'camera' ? 'Camera' : 'Library'} photo`];

    if (previewAsset.width && previewAsset.height) {
      parts.push(`${previewAsset.width}x${previewAsset.height}`);
    }

    const sizeLabel = formatBytes(previewAsset.fileSize);
    if (sizeLabel) {
      parts.push(sizeLabel);
    }

    return parts.join(' | ');
  }, [previewAsset]);

  const refreshPermissionStatus = () => {
    setCameraPermission(Camera.getCameraPermissionStatus());
  };

  const requestCameraAccess = async () => {
    const currentPermission = Camera.getCameraPermissionStatus();
    setCameraPermission(currentPermission);

    if (currentPermission === 'granted') {
      return true;
    }

    if (currentPermission === 'denied' || currentPermission === 'restricted') {
      return false;
    }

    setIsRequestingPermission(true);

    try {
      const nextPermission = await Camera.requestCameraPermission();
      const normalizedPermission =
        nextPermission === 'granted' ? 'granted' : 'denied';
      setCameraPermission(normalizedPermission);
      return normalizedPermission === 'granted';
    } finally {
      setIsRequestingPermission(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      setPreviewAsset(null);
      setCameraError(null);
      setIsCameraReady(false);
      return;
    }

    refreshPermissionStatus();
    setCameraError(null);
    setFlashEnabled(false);
    setCameraPosition('back');

    if (Camera.getCameraPermissionStatus() === 'not-determined') {
      requestCameraAccess().catch(() => undefined);
    }
  }, [visible]);

  useEffect(() => {
    setFlashEnabled(false);
    setIsCameraReady(false);
  }, [cameraPosition]);

  const closeModal = () => {
    setPreviewAsset(null);
    setCameraError(null);
    setIsCameraReady(false);
    onClose();
  };

  const handleCapture = async () => {
    if (isCapturing || !activeDevice || !isCameraReady) {
      return;
    }

    const hasAccess =
      cameraPermission === 'granted' ? true : await requestCameraAccess();

    if (!hasAccess) {
      setCameraError('Camera access is required before you can capture a product photo.');
      return;
    }

    try {
      setIsCapturing(true);
      setCameraError(null);
      const photo = await cameraRef.current?.takePhoto({
        flash: flashEnabled && activeDevice.hasFlash ? 'on' : 'off',
        enableShutterSound: false,
      });

      if (!photo) {
        setCameraError('The camera did not return a photo. Please try again.');
        return;
      }

      setPreviewAsset(buildCameraAsset(photo));
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : 'Unable to capture a photo right now.',
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      setIsPickingFromLibrary(true);
      setCameraError(null);
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
        maxWidth: 1920,
        maxHeight: 1920,
        presentationStyle: 'fullScreen',
      });

      if (response.didCancel) {
        return;
      }

      const nextAsset = buildLibraryAsset(response.assets?.[0]);

      if (!nextAsset) {
        setCameraError(
          response.errorMessage ??
            'The selected file is missing a valid image path.',
        );
        return;
      }

      setPreviewAsset(nextAsset);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : 'Unable to open the photo library right now.',
      );
    } finally {
      setIsPickingFromLibrary(false);
    }
  };

  const handleConfirmPreview = () => {
    if (!previewAsset) {
      return;
    }

    onSelectImage(previewAsset);
    setPreviewAsset(null);
    setCameraError(null);
  };

  const openAppSettings = () => {
    Linking.openSettings().catch(() => undefined);
  };

  const librarySheetStyle = useMemo(
    () => [
      styles.librarySheet,
      {
        backgroundColor: dark ? theme.surface : '#FFFFFF',
        borderTopColor: alpha(theme.border, 0.92),
      },
    ],
    [dark, theme],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={closeModal}>
      <StatusBar barStyle="light-content" backgroundColor="#05080c" />
      <SafeAreaView style={styles.safeArea}>
        {previewAsset ? (
          <View style={styles.previewWrap}>
            <Image source={{uri: previewAsset.uri}} style={styles.previewImage} />
            <View
              style={[
                styles.previewOverlay,
                {backgroundColor: alpha('#05080c', 0.26)},
              ]}
            />
            <View style={styles.previewTopBar}>
              <Pressable
                onPress={() => setPreviewAsset(null)}
                style={[styles.iconButton, styles.iconButtonLeading]}>
                <AppIcon name="x" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.previewBottomSheet}>
              <Text style={styles.previewEyebrow}>IMAGE PREVIEW</Text>
              <Text style={styles.previewTitle}>{previewAsset.fileName}</Text>
              {previewMeta ? (
                <Text style={styles.previewMeta}>{previewMeta}</Text>
              ) : null}

              <View style={styles.previewActions}>
                <Pressable
                  onPress={() => setPreviewAsset(null)}
                  style={[styles.secondaryAction, styles.previewActionFlex]}>
                  <Text style={styles.secondaryActionLabel}>Retake</Text>
                </Pressable>
                <Pressable
                  onPress={handlePickFromLibrary}
                  style={[styles.secondaryAction, styles.previewActionFlex]}>
                  <Text style={styles.secondaryActionLabel}>Library</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleConfirmPreview}
                style={styles.primaryAction}>
                <Text style={styles.primaryActionLabel}>Use this photo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.cameraStage}>
              {cameraPermission === 'granted' && activeDevice ? (
                <>
                  <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={activeDevice}
                    isActive={visible}
                    photo
                    photoQualityBalance="speed"
                    enableZoomGesture
                    onInitialized={() => setIsCameraReady(true)}
                    onError={error => setCameraError(error.message)}
                  />
                  <View
                    style={[
                      styles.cameraOverlay,
                      {backgroundColor: alpha('#05080c', 0.18)},
                    ]}
                  />
                </>
              ) : (
                <View
                  style={[
                    styles.permissionStage,
                    {backgroundColor: alpha(theme.bg, 0.96)},
                  ]}>
                  <View
                    style={[
                      styles.permissionGlyph,
                      {backgroundColor: alpha(theme.accent, 0.12)},
                    ]}>
                    <AppIcon name="camera" size={28} color={theme.accent} />
                  </View>
                  <Text style={styles.permissionTitle}>
                    {isRequestingPermission
                      ? 'Requesting camera access'
                      : cameraPermission === 'restricted'
                        ? 'Camera access is restricted'
                        : cameraPermission === 'denied'
                          ? 'Camera access is blocked'
                          : 'Preparing camera'}
                  </Text>
                  <Text style={styles.permissionBody}>
                    {isRequestingPermission
                      ? 'Please wait while the app checks whether it can open the camera preview.'
                      : cameraPermission === 'restricted'
                        ? 'This device is preventing camera access for the app. You can still pick an existing product photo from the library.'
                        : cameraPermission === 'denied'
                          ? 'Allow camera access in system settings to capture a new product photo inside Search.'
                          : 'The camera preview will appear here after permission is granted.'}
                  </Text>

                  <View style={styles.permissionActions}>
                    {cameraPermission === 'denied' ||
                    cameraPermission === 'restricted' ? (
                      <Pressable
                        onPress={openAppSettings}
                        style={[styles.primaryAction, styles.permissionButton]}>
                        <Text style={styles.primaryActionLabel}>Open settings</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={handlePickFromLibrary}
                      style={[styles.secondaryAction, styles.permissionButton]}>
                      <Text style={styles.secondaryActionLabel}>
                        Choose from library
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.topBar}>
                <Pressable onPress={closeModal} style={styles.iconButton}>
                  <AppIcon name="x" size={18} color="#FFFFFF" />
                </Pressable>

                <View style={styles.topBarActions}>
                  <Pressable
                    onPress={handlePickFromLibrary}
                    style={[styles.iconButton, styles.iconButtonTrailing]}
                    disabled={isPickingFromLibrary}>
                    {isPickingFromLibrary ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <AppIcon name="image" size={18} color="#FFFFFF" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => setFlashEnabled(value => !value)}
                    disabled={!activeDevice?.hasFlash}
                    style={[
                      styles.iconButton,
                      styles.iconButtonTrailing,
                      !activeDevice?.hasFlash ? styles.iconButtonDisabled : null,
                    ]}>
                    <AppIcon
                      name="zap"
                      size={18}
                      color={flashEnabled && activeDevice?.hasFlash ? '#FFF07D' : '#FFFFFF'}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setCameraPosition(current =>
                        current === 'back' ? 'front' : 'back',
                      )
                    }
                    style={[styles.iconButton, styles.iconButtonTrailing]}>
                    <AppIcon name="refresh-cw" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              {cameraPermission === 'granted' && activeDevice ? (
                <>
                  <View style={styles.captureHintWrap}>
                    <Text style={styles.captureHintLabel}>
                      Tap the shutter to search with a product photo
                    </Text>
                  </View>

                  <View style={styles.captureActions}>
                    <Pressable
                      onPress={handlePickFromLibrary}
                      style={styles.quickLibraryButton}>
                      <AppIcon name="image" size={16} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                      onPress={handleCapture}
                      style={styles.captureButton}
                      disabled={!isCameraReady || isCapturing}>
                      <View style={styles.captureButtonInner}>
                        {isCapturing ? (
                          <ActivityIndicator size="small" color="#1A1A1A" />
                        ) : null}
                      </View>
                    </Pressable>
                    <View style={styles.quickLibrarySpacer} />
                  </View>
                </>
              ) : null}
            </View>

            <View style={librarySheetStyle}>
              <View style={styles.libraryHeader}>
                <View>
                  <Text style={[styles.libraryTitle, {color: theme.text}]}>
                    Search from library
                  </Text>
                  <Text style={[styles.libraryBody, {color: theme.textMuted}]}>
                    Recent photos stay here so you can re-run product search quickly.
                  </Text>
                </View>

                <Pressable onPress={handlePickFromLibrary}>
                  <Text style={[styles.libraryAction, {color: theme.accent}]}>
                    Browse
                  </Text>
                </Pressable>
              </View>

              {recentImageList.length ? (
                <View style={styles.thumbnailGrid}>
                  {recentImageList.map(asset => (
                    <Pressable
                      key={asset.id}
                      onPress={() => setPreviewAsset(asset)}
                      style={[
                        styles.thumbnailCard,
                        {borderColor: alpha(theme.border, 0.8)},
                      ]}>
                      <Image
                        source={{uri: asset.uri}}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <EmptyLibraryState
                  onPress={handlePickFromLibrary}
                  accent={theme.accent}
                  textColor={theme.text}
                  mutedColor={theme.textMuted}
                />
              )}

              {cameraError ? (
                <Text style={[styles.inlineError, {color: theme.danger}]}>
                  {cameraError}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05080c',
  },
  cameraStage: {
    flex: 1,
    minHeight: 460,
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  previewWrap: {
    flex: 1,
    backgroundColor: '#05080c',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  previewTopBar: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 13, 18, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLeading: {
    marginLeft: 0,
  },
  iconButtonTrailing: {
    marginLeft: 12,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  captureHintWrap: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 124,
    alignItems: 'center',
  },
  captureHintLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(19, 21, 26, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  captureActions: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLibraryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(10, 13, 18, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLibrarySpacer: {
    width: 48,
  },
  captureButton: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 10,
  },
  captureButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#4C4C4C',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  librarySheet: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  libraryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  libraryBody: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 244,
  },
  libraryAction: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  thumbnailCard: {
    width: '31.2%',
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#15202B',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  emptyLibraryCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  emptyLibraryGlyph: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyLibraryTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyLibraryBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyLibraryAction: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 14,
  },
  permissionStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionGlyph: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  permissionBody: {
    color: '#B8C3CC',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  permissionActions: {
    width: '100%',
    marginTop: 20,
  },
  permissionButton: {
    marginTop: 12,
  },
  previewBottomSheet: {
    marginTop: 'auto',
    backgroundColor: 'rgba(12, 15, 21, 0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  previewEyebrow: {
    color: '#41D7FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  previewMeta: {
    color: '#A9B6C2',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  previewActionFlex: {
    flex: 1,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#41D7FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryActionLabel: {
    color: '#04121A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryActionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineError: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
