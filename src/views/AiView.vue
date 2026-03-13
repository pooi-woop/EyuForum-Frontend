<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiApi } from '../services/userApi'
import { ElMessage } from 'element-plus'

interface Message {
  id: string
  content: string
  role: 'user' | 'ai'
  timestamp: number
}

const messages = ref<Message[]>([])
const inputQuestion = ref('')
const isStreaming = ref(false)
const isLoading = ref(false)
const isStreamingLoading = ref(false)

onMounted(() => {
  // 欢迎消息
  messages.value = [{
    id: 'welcome',
    content: '你好！我是 EyuForum 的 AI 助手，有什么可以帮你的吗？',
    role: 'ai',
    timestamp: Date.now()
  }]
})

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const sendQuestion = async () => {
  if (!inputQuestion.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }
  
  const question = inputQuestion.value.trim()
  const messageId = generateId()
  
  // 添加用户消息
  messages.value.push({
    id: messageId,
    content: question,
    role: 'user',
    timestamp: Date.now()
  })
  
  inputQuestion.value = ''
  
  if (isStreaming.value) {
    await sendStreamQuestion(question, messageId)
  } else {
    await sendNormalQuestion(question, messageId)
  }
}

const sendNormalQuestion = async (question: string, messageId: string) => {
  try {
    isLoading.value = true
    
    const response = await aiApi.ask({ question })
    
    // 添加AI回复
    messages.value.push({
      id: generateId(),
      content: response.answer || '抱歉，我无法回答这个问题。',
      role: 'ai',
      timestamp: Date.now()
    })
  } catch (err: any) {
    console.error('AI 问答错误:', err)
    ElMessage.error(err.response?.data?.error || 'AI 问答失败')
    
    // 添加错误消息
    messages.value.push({
      id: generateId(),
      content: '抱歉，AI 问答服务暂时不可用，请稍后再试。',
      role: 'ai',
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
  }
}

const sendStreamQuestion = async (question: string, messageId: string) => {
  try {
    isStreamingLoading.value = true
    
    const aiMessageId = generateId()
    
    // 添加一个空的AI回复，后续会更新
    messages.value.push({
      id: aiMessageId,
      content: '',
      role: 'ai',
      timestamp: Date.now()
    })
    
    const response = await fetch('http://localhost:8080/api/ai/ask/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let answer = ''
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim()
            if (data && data !== '[DONE]') {
              answer += data + '\n'
              
              // 更新AI回复内容
              const index = messages.value.findIndex((msg) => msg.id === aiMessageId)
              if (index !== -1) {
                messages.value[index].content = answer
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('AI 流式问答错误:', err)
    ElMessage.error(err.message || 'AI 流式问答失败')
    
    // 添加错误消息
    messages.value.push({
      id: generateId(),
      content: '抱歉，AI 流式问答服务暂时不可用，请稍后再试。',
      role: 'ai',
      timestamp: Date.now()
    })
  } finally {
    isStreamingLoading.value = false
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="ai-container">
    <h1>AI 问答</h1>
    
    <div class="chat-container">
      <div class="messages" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.role]"
        >
          <div class="message-header">
            <span class="role">{{ message.role === 'user' ? '你' : 'AI' }}</span>
            <span class="time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">{{ message.content }}</div>
        </div>
      </div>
      
      <div class="input-container">
        <el-checkbox v-model="isStreaming" label="流式传输" class="stream-checkbox" />
        <el-input
          v-model="inputQuestion"
          type="textarea"
          :rows="3"
          placeholder="请输入你的问题..."
          maxlength="1000"
          show-word-limit
          :disabled="isLoading || isStreamingLoading"
        />
        <el-button 
          type="primary" 
          @click="sendQuestion"
          :loading="isLoading || isStreamingLoading"
          :disabled="!inputQuestion.trim() || isLoading || isStreamingLoading"
        >
          {{ isStreaming ? '发送（流式）' : '发送' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.ai-container h1 {
  color: #333;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

.chat-container {
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.messages {
  max-height: 600px;
  overflow-y: auto;
  padding: 1.5rem;
}

.message {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.ai {
  align-items: flex-start;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.message-content {
  padding: 1rem;
  border-radius: 8px;
  max-width: 80%;
  line-height: 1.6;
  word-break: break-word;
}

.message.user .message-content {
  background: #409eff;
  color: white;
  border-bottom-right-radius: 2px;
}

.message.ai .message-content {
  background: white;
  color: #333;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 2px;
}

.input-container {
  padding: 1.5rem;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.stream-checkbox {
  margin-bottom: 1rem;
  display: block;
}

.input-container .el-button {
  margin-top: 1rem;
  width: 100%;
}

/* 滚动条样式 */
.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 768px) {
  .ai-container {
    padding: 0 1rem;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .input-container {
    padding: 1rem;
  }
}
</style>
