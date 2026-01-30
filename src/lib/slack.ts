interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text: string;
    emoji?: boolean;
  }>;
}

interface TodoItem {
  content: string;
  completed: boolean;
}

export async function sendSlackMessage(webhookUrl: string, message: SlackMessage) {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("Slack webhook error:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Slack webhook error:", error);
    return false;
  }
}

export function createStartDayMessage(userName: string, todos: TodoItem[]) {
  const todoList = todos
    .map((todo) => `• ${todo.content}`)
    .join("\n");

  return {
    text: `${userName}님이 오늘 업무를 시작했습니다`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚀 ${userName}님이 오늘 업무를 시작했습니다`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: todoList || "_할 일이 없습니다_",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            text: `총 ${todos.length}개의 할 일`,
            emoji: true,
          },
        ],
      },
    ],
  };
}

export function createTodoCompletedMessage(
  userName: string,
  todoContent: string,
  completedCount: number,
  totalCount: number
) {
  return {
    text: `${userName}님이 "${todoContent}"을(를) 완료했습니다`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *${userName}*님이 "${todoContent}"을(를) 완료했습니다 (${completedCount}/${totalCount})`,
        },
      },
    ],
  };
}
