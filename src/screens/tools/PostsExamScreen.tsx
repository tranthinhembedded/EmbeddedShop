import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {
  POSTS_EXAM_ENDPOINT,
  usePostsExam,
  type ExamPost,
} from '../../hooks/usePostsExam';
import {useRenderMetric} from '../../hooks/useRenderMetric';
import type {RootStackParamList} from '../../navigation/types';
import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostsExam'>;

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

function PostCard({
  post,
  theme,
}: {
  post: ExamPost;
  theme: typeof CONTROL_ROOM_THEME;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.postCard,
        {
          backgroundColor: alpha(theme.panel, 0.96),
          borderColor: alpha(theme.border, 0.9),
        },
      ]}>
      <Text style={[styles.postMeta, {color: theme.accent}]}>POST #{post.id}</Text>
      <Text style={[styles.postTitle, {color: theme.text}]}>{post.title}</Text>
      <Text numberOfLines={3} style={[styles.postBody, {color: theme.textMuted}]}>
        {post.body}
      </Text>
    </View>
  );
}

function ScreenHeader({
  theme,
  dark,
  onBack,
  onRefresh,
  refreshing,
  total,
}: {
  theme: typeof CONTROL_ROOM_THEME;
  dark: boolean;
  onBack: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  total?: number;
}): React.JSX.Element {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={[
            styles.headerButton,
            {
              backgroundColor: alpha(theme.panelAlt, 0.92),
              borderColor: alpha(theme.border, 0.92),
            },
          ]}>
          <Text style={[styles.headerButtonLabel, {color: theme.text}]}>Back</Text>
        </Pressable>

        <Pressable
          onPress={onRefresh}
          style={[
            styles.headerButton,
            {
              backgroundColor: dark ? alpha(theme.accent, 0.16) : alpha(theme.accent, 0.1),
              borderColor: alpha(theme.accent, 0.3),
            },
          ]}>
          <Text style={[styles.headerButtonLabel, {color: theme.accent}]}>
            {refreshing ? 'Refreshing...' : 'Refetch'}
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: alpha(theme.panel, 0.96),
            borderColor: alpha(theme.border, 0.94),
          },
        ]}>
        <Text style={[styles.eyebrow, {color: theme.accent}]}>TANSTACK QUERY</Text>
        <Text style={[styles.title, {color: theme.text}]}>Posts exam screen</Text>
        <Text style={[styles.body, {color: theme.textMuted}]}>
          This screen uses `useQuery` with the fixed query key `['exam-posts']`
          and fetches 12 posts from JSONPlaceholder.
        </Text>
        <Text style={[styles.metaLine, {color: theme.textMuted}]}>
          Endpoint: {POSTS_EXAM_ENDPOINT}
        </Text>
        <Text style={[styles.metaLine, {color: theme.textMuted}]}>
          Loaded items: {total ?? 0}
        </Text>
      </View>
    </View>
  );
}

export default function PostsExamScreen({
  navigation,
}: Props): React.JSX.Element {
  useRenderMetric('PostsExam');

  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const postsQuery = usePostsExam();
  const errorMessage =
    postsQuery.error instanceof Error
      ? postsQuery.error.message
      : 'Unable to load posts right now.';

  const handleRefresh = () => {
    void postsQuery.refetch();
  };

  const header = (
    <ScreenHeader
      theme={theme}
      dark={dark}
      onBack={() => navigation.goBack()}
      onRefresh={handleRefresh}
      refreshing={postsQuery.isRefetching}
      total={postsQuery.data?.length}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />

      {postsQuery.isPending ? (
        <View style={styles.stateWrap}>
          {header}
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.stateTitle, {color: theme.text}]}>Loading posts</Text>
            <Text style={[styles.stateBody, {color: theme.textMuted}]}>
              Waiting for the first response from the `exam-posts` query.
            </Text>
          </View>
        </View>
      ) : postsQuery.isError ? (
        <View style={styles.stateWrap}>
          {header}
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.stateTitle, {color: theme.text}]}>Unable to load posts</Text>
            <Text style={[styles.stateBody, {color: theme.textMuted}]}>
              {errorMessage}
            </Text>
            <Pressable
              onPress={handleRefresh}
              style={[
                styles.retryButton,
                {
                  backgroundColor: theme.accent,
                },
              ]}>
              <Text style={styles.retryButtonLabel}>Thu lai</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={postsQuery.data ?? []}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => <PostCard post={item} theme={theme} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View
              style={[
                styles.stateCard,
                {
                  backgroundColor: alpha(theme.panel, 0.96),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.stateTitle, {color: theme.text}]}>No posts found</Text>
              <Text style={[styles.stateBody, {color: theme.textMuted}]}>
                The request succeeded but returned an empty list.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={postsQuery.isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          ListFooterComponent={
            postsQuery.isRefetching ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerWrap: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaLine: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  postCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  postMeta: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 10,
  },
  postBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 12,
  },
  stateWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  stateCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 16,
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    marginTop: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonLabel: {
    color: '#061018',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
