const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

const welcome = document.getElementById("welcome");

const sendBtn = document.getElementById("sendBtn");

const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

const suggestions =
  document.querySelectorAll(".suggestion");


let conversation = [];

let isSending = false;


/* -------------------------
   TEXTAREA
------------------------- */

function resizeTextarea() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      180
    ) + "px";

}


messageInput.addEventListener(
  "input",
  resizeTextarea
);


/* -------------------------
   MESSAGE
------------------------- */

function addUserMessage(text) {

  const message =
    document.createElement("div");

  message.className =
    "message user";


  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.textContent =
    text;


  message.appendChild(content);

  messages.appendChild(message);


  scrollToBottom();

}


function addAIMessage(text) {

  const message =
    document.createElement("div");

  message.className =
    "message ai";


  const avatar =
    document.createElement("div");

  avatar.className =
    "ai-avatar";

  avatar.textContent =
    "A";


  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.textContent =
    text;


  message.appendChild(avatar);

  message.appendChild(content);

  messages.appendChild(message);


  scrollToBottom();

}


function addLoading() {

  const message =
    document.createElement("div");

  message.className =
    "message ai";

  message.id =
    "loadingMessage";


  const avatar =
    document.createElement("div");

  avatar.className =
    "ai-avatar";

  avatar.textContent =
    "A";


  const content =
    document.createElement("div");

  content.className =
    "message-content";


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
    document.getElementById(
      "loadingMessage"
    );

  if (loading) {
    loading.remove();
  }

}


/* -------------------------
   SCROLL
------------------------- */

function scrollToBottom() {

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });

}


/* -------------------------
   SEND
------------------------- */

async function sendMessage(text) {

  const clean =
    text.trim();


  if (!clean || isSending) {
    return;
  }


  isSending = true;

  sendBtn.disabled = true;


  welcome.classList.add(
    "hidden"
  );


  addUserMessage(clean);


  conversation.push({
    role: "user",
    text: clean
  });


  messageInput.value = "";

  resizeTextarea();


  addLoading();


  try {

    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              messages:
                conversation
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Gagal mendapatkan jawaban."
      );

    }


    removeLoading();


    addAIMessage(
      data.text
    );


    conversation.push({
      role: "model",
      text: data.text
    });


  } catch (error) {

    removeLoading();


    addAIMessage(
      "Maaf, terjadi masalah saat menghubungi After 1.0.\n\n" +
      error.message
    );

  } finally {

    isSending = false;

    sendBtn.disabled = false;

    messageInput.focus();

  }

}


/* -------------------------
   FORM
------------------------- */

chatForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    sendMessage(
      messageInput.value
    );

  }
);


/* -------------------------
   ENTER
------------------------- */

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


/* -------------------------
   SUGGESTIONS
------------------------- */

suggestions.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const prompt =
          button.dataset.prompt;

        sendMessage(prompt);

      }
    );

  }
);


/* -------------------------
   NEW CHAT
------------------------- */

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


/* -------------------------
   INIT
------------------------- */

resizeTextarea();

messageInput.focus();
