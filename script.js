const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

const welcome = document.getElementById("welcome");

const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

const suggestions = document.querySelectorAll(".suggestion");

let conversation = [];
let isSending = false;


/*
  GANTI URL DI BAWAH DENGAN URL VERCEL KAMU.

  Contoh:
  https://after-1-0.vercel.app/api/chat
*/

const API_URL =
  "https://after-1-0.vercel.app/api/chat";


function resizeTextarea() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 180) + "px";
}


function scrollToBottom() {
  requestAnimationFrame(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  });
}


function addUserMessage(text) {
  const message = document.createElement("div");
  message.className = "message user";

  const content = document.createElement("div");
  content.className = "message-content";

  content.textContent = text;

  message.appendChild(content);
  messages.appendChild(message);

  scrollToBottom();
}


function addAIMessage(text) {
  const message = document.createElement("div");
  message.className = "message ai";

  const avatar = document.createElement("div");
  avatar.className = "ai-avatar";
  avatar.textContent = "A";

  const content = document.createElement("div");
  content.className = "message-content";

  content.textContent = text;

  message.appendChild(avatar);
  message.appendChild(content);

  messages.appendChild(message);

  scrollToBottom();
}


function addLoading() {
  const message = document.createElement("div");

  message.className = "message ai";
  message.id = "loadingMessage";

  const avatar = document.createElement("div");

  avatar.className = "ai-avatar";
  avatar.textContent = "A";

  const content = document.createElement("div");

  content.className = "message-content";

  content.innerHTML = `
    <div class="loading">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  message.appendChild(avatar);
  message.appendChild(content);

  messages.appendChild(message);

  scrollToBottom();
}


function removeLoading() {
  const loading =
    document.getElementById("loadingMessage");

  if (loading) {
    loading.remove();
  }
}


async function sendMessage(text) {
  const clean = text.trim();

  if (!clean || isSending) {
    return;
  }

  if (
    API_URL.includes("NAMA-PROJECT-KAMU")
  ) {
    addAIMessage(
      "API belum dikonfigurasi.\n\n" +
      "Buka script.js lalu ganti API_URL dengan URL Vercel kamu."
    );

    return;
  }


  isSending = true;
  sendBtn.disabled = true;

  welcome.classList.add("hidden");

  addUserMessage(clean);

  conversation.push({
    role: "user",
    text: clean
  });

  messageInput.value = "";

  resizeTextarea();

  addLoading();


  try {

    const response = await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({
          messages: conversation
        })
      }
    );


    const contentType =
      response.headers.get("content-type") || "";


    if (!contentType.includes("application/json")) {

      const html = await response.text();

      console.error(
        "Server mengembalikan non-JSON:",
        html
      );

      throw new Error(
        "Backend tidak mengembalikan JSON. " +
        "Periksa URL Vercel dan endpoint /api/chat."
      );
    }


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        `Request gagal dengan status ${response.status}.`
      );

    }


    if (
      !data.text ||
      typeof data.text !== "string"
    ) {

      throw new Error(
        "Backend tidak mengirim jawaban AI yang valid."
      );

    }


    removeLoading();

    addAIMessage(data.text);


    conversation.push({
      role: "model",
      text: data.text
    });


  } catch (error) {

    removeLoading();

    console.error(
      "After 1.0 Error:",
      error
    );


    addAIMessage(
      "After 1.0 mengalami error.\n\n" +
      error.message
    );


  } finally {

    isSending = false;

    sendBtn.disabled = false;

    messageInput.focus();

  }
}


chatForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    sendMessage(
      messageInput.value
    );

  }
);


messageInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      chatForm.requestSubmit();

    }

  }
);


suggestions.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        sendMessage(
          button.dataset.prompt
        );

      }
    );

  }
);


function newChat() {

  conversation = [];

  messages.innerHTML = "";

  welcome.classList.remove(
    "hidden"
  );

  messageInput.value = "";

  resizeTextarea();

  messageInput.focus();

}


clearBtn.addEventListener(
  "click",
  newChat
);


newChatBtn.addEventListener(
  "click",
  newChat
);


messageInput.addEventListener(
  "input",
  resizeTextarea
);


resizeTextarea();
