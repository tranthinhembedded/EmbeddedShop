import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GoogleGenerativeAI} from '@google/generative-ai';
// @ts-ignore
import {GEMINI_API_KEY} from '@env';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/types';
import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';
import {AppIcon} from '../../components/AppIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'AIChatExam'>;

type Message = {
  id: string;
  role: 'user' | 'model'; // Google mapping: 'model' instead of 'assistant' if sending history
  text: string;
};

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const MAX_LENGTH = 500; // Limit token cost as per requirements

export default function AIChatExamScreen({
  navigation,
}: Props): React.JSX.Element {
  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const sendMessageToGeminiAPI = async (text: string, isRetry = false): Promise<string> => {
    try {
      console.log('Sending to Gemini... Key length:', GEMINI_API_KEY?.length);
      const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});
      const result = await model.generateContent(text);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini Raw Error:', error);
      // Handle network errors or HTTP 429
      const errorStr = String(error?.message || error).toLowerCase();
      const isRateLimit = errorStr.includes('429') || errorStr.includes('quota');
      const isNetworkError = errorStr.includes('network') || errorStr.includes('fetch');

      // Retry requirement: If 429 or network error, retry exactly 1 time after delay
      if (!isRetry && (isRateLimit || isNetworkError)) {
        console.warn('Network/429 error occurred. Retrying once after 2s...');
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              const retryText = await sendMessageToGeminiAPI(text, true);
              resolve(retryText);
            } catch (retryErr) {
              reject(retryErr);
            }
          }, 2000); // 2 second delay before retry
        });
      }

      // Friendly error handling (don't dump raw sensitive info)
      throw new Error('Dịch vụ AI đang bận hoặc gián đoạn mạng. Bạn thử lại sau nhé!');
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_LENGTH) {
      Alert.alert('Giới hạn độ dài', 'Nội dung vượt quá 500 ký tự. Vui lòng rút gọn.');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponseText = await sendMessageToGeminiAPI(trimmed);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lấy phản hồi từ AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, {backgroundColor: theme.accent}]
            : [
                styles.aiBubble,
                {
                  backgroundColor: dark ? theme.panelAlt : '#FFFFFF',
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ],
        ]}>
        <Text style={[styles.messageText, {color: isUser ? '#061018' : theme.text}]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />

      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: dark ? theme.panelAlt : '#FFFFFF',
              borderColor: theme.border,
            },
          ]}>
          <Text style={[styles.backButtonLabel, {color: theme.text}]}>Back</Text>
        </Pressable>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: dark ? 'rgba(74, 222, 128, 0.18)' : '#E2F8EB',
              borderColor: 'rgba(74, 222, 128, 0.4)',
            },
          ]}>
          <Text style={[styles.badgeLabel, {color: '#16A34A'}]}>AI CHAT</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
        onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <AppIcon name="home" size={48} color={theme.border} />
            <Text style={[styles.emptyText, {color: theme.textMuted}]}>
              Bắt đầu trò chuyện với Assistant.
            </Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.accent} size="small" />
          <Text style={[styles.loadingText, {color: theme.textMuted}]}>
            AI đang trả lời...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={[styles.inputContainer, {borderTopColor: theme.border}]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: dark ? theme.panelAlt : '#F9FAFB',
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Hỏi bất cứ thứ gì..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            maxLength={MAX_LENGTH}
            multiline
          />
          <Pressable
            disabled={isLoading || !inputText.trim()}
            onPress={handleSend}
            style={[
              styles.sendButton,
              {backgroundColor: theme.accent},
              (isLoading || !inputText.trim()) && {opacity: 0.5},
            ]}>
            <AppIcon name="saved" size={20} color="#061018" />
          </Pressable>
        </View>
        <Text style={[styles.charCount, {color: inputText.length >= MAX_LENGTH ? '#EF4444' : theme.textMuted}]}>
          {inputText.length}/{MAX_LENGTH} ký tự (Giới hạn giảm chi phí Token)
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // controlled by theme usually but leaving it here
  },
  backButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    marginVertical: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 12,
  },
});
