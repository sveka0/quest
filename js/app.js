/* =========================
   ГЛОБАЛЬНЫЕ СОСТОЯНИЯ
========================= */
const foundSet = new Set();
let basementRevealed = false;

let forumPlayed = false;
let soundEnabled = true;

/* =========================
   УТИЛИТЫ
========================= */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function setMsg(id, text, ok){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = ok ? "ok" : "bad";
}

function typeInto(el, text, speed = 18){
  return new Promise(resolve => {
    if (!el) return resolve();
    el.textContent = "";
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i] ?? "";
      i++;
      if (i >= text.length){
        clearInterval(t);
        resolve();
      }
    }, speed);
  });
}

function playSound(id){
  if (!soundEnabled) return;
  const a = document.getElementById(id);
  if (!a) return;
  try{
    a.currentTime = 0;
    a.play().catch(()=>{});
  }catch(e){}
}

function playPing(){ playSound("ping"); }

function scrollWrapToBottom(){
  const wrap = document.querySelector(".wrap");
  if (!wrap) return;
  wrap.scrollTo({ top: wrap.scrollHeight, behavior: "smooth" });
}

/* =========================
   КИНО-ПЕРЕХОД (СТАБИЛЬНЫЙ)
========================= */
async function cineTransition(textLines = [], holdMs = 1600){
  const cine = document.getElementById("cine");
  const cineText = document.getElementById("cineText");
  if (!cine || !cineText) return;

  cineText.innerHTML = `
    <div class="cineBox">
      <div class="cineTitle">${textLines[0] || ""}</div>
      <div class="cineSub">${textLines[1] || ""}</div>
    </div>
  `;

  // перезапуск анимации
  cine.classList.remove("on");
  cineText.classList.remove("on");
  void cine.offsetHeight;

  cine.classList.add("on");
  cineText.classList.add("on");
  playSound("whoosh");

  await sleep(holdMs);

  cineText.classList.remove("on");
  cine.classList.remove("on");

  // дать CSS-анимации закончиться
  await sleep(450);
}

/* =========================
   ПЕРЕХОДЫ МЕЖДУ СЦЕНАМИ
========================= */
function go(sceneId){
  const fade = document.getElementById("fade");
  const cineOn = document.getElementById("cine")?.classList.contains("on");

  if (fade && !cineOn) fade.classList.add("on");

  setTimeout(() => {
    document.querySelectorAll(".scene").forEach(s => s.classList.remove("active"));
    const next = document.querySelector(`[data-scene="${sceneId}"]`);
    if (next) next.classList.add("active");

    const wrap = document.querySelector(".wrap");
    if (wrap) wrap.scrollTop = 0;

    if (sceneId === "scene0") setTimeout(playForumScene, 220);

    if (fade) fade.classList.remove("on");
  }, 180);
}

window.addEventListener("DOMContentLoaded", () => go("scene0"));

/* =========================
   ФОРУМ: ДАННЫЕ
========================= */
const forumPosts = [
  { nick:"SteelFox",  time:"23:41", online:true,  badge:"старожил",  text:"Старый элеватор за трассой. Ночью жутковато, но всё как обычно: ветер, эхо, мусор.", reacts:["👀 2"] },
  { nick:"Lumen",     time:"23:44", online:true,  badge:"модератор", text:"Люди любят себе накручивать. «Призраки» — это скрип металла и усталость.", reacts:["😄 1"] },
  { nick:"Nox",       time:"23:49", online:false, badge:"",         text:"Тоннели под городом. Вот там реально давит. Но тоже без мистики.", reacts:[] },

  { system:true, text:"…обсуждение идёт привычно и лениво…" },

  { nick:"Seawatcher", time:"00:12", online:true, badge:"новый", text:"Есть дом, куда лучше не соваться. Там не пусто.", isNew:true, reacts:["👀 3"] },

  { nick:"SteelFox",  time:"00:13", online:true, badge:"", text:"О, понеслась 😄 Хватит заливать, бро.", reacts:["🔥 1","😄 2"] },
  { nick:"Lumen",     time:"00:14", online:true, badge:"", text:"«Привидения»? Давай без клише.", reacts:["😄 1"] },
  { nick:"Nox",       time:"00:15", online:true, badge:"", text:"Фото будет — поверим. И координаты.", reacts:["👀 1"] },

  { nick:"Seawatcher", time:"00:16", online:true, badge:"новый", text:"Проверить слабо? Дом у старого маяка. Я был. И туда больше не вернусь.", isNew:true, reacts:["🔥 2","👀 4"] },

  { system:true, text:"Seawatcher вышел из сети." }
];

function avatarLetter(nick){
  return (nick && nick[0]) ? nick[0].toUpperCase() : "?";
}

function makeActions(){
  return `
    <div class="actions">
      <button type="button" data-act="reply">Ответить</button>
      <button type="button" data-act="quote">Цитировать</button>
      <button type="button" data-act="react">Реакции</button>
    </div>
  `;
}

function makeReacts(list){
  if (!list || !list.length) return "";
  return `<div class="reacts">${list.map(x => `<span class="react">${x}</span>`).join("")}</div>`;
}

function makePostHTML(p){
  if (p.system) return `<div class="sys">${p.text}</div>`;

  const dot = p.online ? `<span class="onlineDot"></span>` : "";
  const badge = p.badge ? `<span class="badge">${p.badge}</span>` : "";
  const newClass = p.isNew ? "new" : "";

  return `
    <div class="post reveal ${newClass}" data-nick="${p.nick}">
      <div class="avatar">${avatarLetter(p.nick)}</div>
      <div class="postBody">
        <div class="nickRow">
          ${dot}<span class="nick">${p.nick}</span>
          <span class="meta">${p.time}</span>
          ${badge}
        </div>
        <div class="quote"></div>
        ${makeActions()}
        ${makeReacts(p.reacts)}
      </div>
    </div>
  `;
}

function forumGlitch(){
  const box = document.querySelector(".forum");
  if (!box) return;
  box.classList.remove("glitch");
  void box.offsetWidth;
  box.classList.add("glitch");
  playSound("glitch");
}

/* =========================
   ФОРУМ: СЦЕНАРИЙ
========================= */
async function playForumScene(){
  if (forumPlayed) return;
  forumPlayed = true;

  const feed = document.getElementById("forumFeed");
  const typingLine = document.getElementById("typingLine");
  const typingName = document.getElementById("typingName");
  const replyBox = document.getElementById("replyBox");
  const replySend = document.getElementById("replySend");
  const replyInput = document.getElementById("replyInput");

  if (!feed || !typingLine || !typingName) return;

  feed.innerHTML = "";
  typingLine.style.display = "none";
  if (replyBox) replyBox.style.display = "none";

  for (let i = 0; i < forumPosts.length; i++){
    const p = forumPosts[i];

    if (p.system){
      await sleep(320);
      feed.insertAdjacentHTML("beforeend", makePostHTML(p));
      scrollWrapToBottom();
      continue;
    }

    typingName.textContent = p.nick;
    typingLine.style.display = "block";
    await sleep(420 + Math.random()*320);

    feed.insertAdjacentHTML("beforeend", makePostHTML(p));
    const last = feed.lastElementChild;
    const quote = last?.querySelector(".quote");

    typingLine.style.display = "none";
    playPing();

    await typeInto(quote, p.text, p.nick === "Seawatcher" ? 22 : 16);

    if (p.nick === "Seawatcher" && p.time === "00:16"){
      await sleep(300);

      const lastSW = [...feed.querySelectorAll('.post[data-nick="Seawatcher"]')].pop();
      if (lastSW){
        lastSW.classList.add("offline");
        const dot = lastSW.querySelector(".onlineDot");
        if (dot) dot.style.opacity = ".35";
      }

      await sleep(160);
      forumGlitch();
    }

    scrollWrapToBottom();
    await sleep(140);

    if (i === 6 && replyBox){
      replyBox.style.display = "flex";
      scrollWrapToBottom();
    }
  }

  // кнопки под постами
  feed.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;
    const post = btn.closest(".post");
    const nick = post?.dataset.nick || "user";

    if (act === "reply"){
      if (replyBox){
        replyBox.style.display = "flex";
        replyInput?.focus();
        scrollWrapToBottom();
      }
      return;
    }

    if (act === "quote"){
      const q = post?.querySelector(".quote")?.textContent || "";
      if (replyInput){
        replyInput.value = `> ${nick}: ${q}\n`;
        replyInput.focus();
        scrollWrapToBottom();
      }
      return;
    }

    if (act === "react"){
      const reacts = post?.querySelector(".reacts");
      const arr = ["🔥", "👀", "😄"];
      const em = arr[Math.floor(Math.random()*arr.length)];
      const chip = document.createElement("span");
      chip.className = "react";
      chip.textContent = `${em} 1`;

      if (reacts){
        reacts.appendChild(chip);
      }else{
        const div = document.createElement("div");
        div.className = "reacts";
        div.appendChild(chip);
        post?.querySelector(".postBody")?.appendChild(div);
      }
    }
  });

  // отправка сообщения игрока
  if (replySend && replyInput){
    replySend.onclick = async () => {
      const txt = replyInput.value.trim();
      if (!txt) return;

      const you = { nick:"Ты", time:"00:17", online:true, badge:"", text:txt, reacts:[] };
      replyInput.value = "";

      typingName.textContent = "Ты";
      typingLine.style.display = "block";
      await sleep(320);
      typingLine.style.display = "none";

      feed.insertAdjacentHTML("beforeend", makePostHTML(you));
      const last = feed.lastElementChild;
      const quote = last?.querySelector(".quote");

      playPing();
      await typeInto(quote, you.text, 14);
      scrollWrapToBottom();

      typingName.textContent = "SteelFox";
      typingLine.style.display = "block";
      await sleep(520);
      typingLine.style.display = "none";

      const reply = {
        nick:"SteelFox",
        time:"00:18",
        online:true,
        badge:"",
        text:"Если это байка — то норм. Но координаты «у маяка» звучат слишком конкретно…",
        reacts:["👀 2"]
      };

      feed.insertAdjacentHTML("beforeend", makePostHTML(reply));
      const last2 = feed.lastElementChild;
      const quote2 = last2?.querySelector(".quote");

      playPing();
      await typeInto(quote2, reply.text, 16);
      scrollWrapToBottom();
    };
  }
}

/* =========================
   ДОРОГА К МАЯКУ (КИНО)
========================= */
async function goToLighthouse(){
  await cineTransition(
    ["Дорога к маяку", "Связь исчезает. Море слышно раньше, чем видно."],
    1700
  );
  await sleep(120);
  go("scene0b");
}

/* =========================
   ВОРОТА
========================= */
function startFromGate(choice){
  const msgId = "gateMsg";

  if (choice === "main"){
    setMsg(msgId, "Ты толкаешь ворота. Скрип почти бесшумен. Впереди — тёмный вход.", true);
    setTimeout(() => go("scene1"), 450);
    return;
  }
  if (choice === "perimeter"){
    setMsg(msgId, "Ты обходишь двор. Следов почти нет… но гул меняет направление, будто реагирует на шаги.", true);
    setTimeout(() => go("scene1"), 700);
    return;
  }
  if (choice === "forum"){
    setMsg(msgId, "Сети нет. Сообщение не уходит. Только одинокая «попытка отправки…».", false);
    return;
  }
  if (choice === "leave"){
    setMsg(msgId, "Ты почти заводишь двигатель… и вдруг гул становится сильнее. На секунду кажется, что дом «заметил» тебя.", false);
    setTimeout(() => setMsg(msgId, "Ты остаёшься. Просто чтобы убедиться, что это была не игра воображения.", true), 900);
    setTimeout(() => go("scene1"), 1600);
  }
}

/* =========================
   ДВЕРИ
========================= */
function clearDoorStates(){
  document.querySelectorAll(".door").forEach(d => {
    d.classList.remove("selected","locked","opened");
  });
}

function pickDoor(n){
  clearDoorStates();
  const btn = document.querySelector(`.door[data-door="${n}"]`);
  if (btn) btn.classList.add("selected");

  // логика дверей:
  if (n === 1){
    btn?.classList.add("opened");
    setMsg("result", "Дверь тихо поддаётся. Внутри пахнет бумагой и металлом.", true);
    setTimeout(() => go("scene2"), 260);
    return;
  }

  if (n === 2){
    setMsg("result", "Замок щёлкает… и ждёт ответа.", true);
    // запуск викторины находится в quiz.js (startQuiz)
    // важно: функция startQuiz существует после загрузки quiz.js
    if (typeof startQuiz === "function"){
      startQuiz({
        count: 7,
        passNeed: 5,
        onPass: () => go("scene2") // куда вести после успеха
      });
    } else {
      setMsg("result", "Не найден модуль викторины (quiz.js).", false);
    }
    return;
  }

  if (n === 3){
    setMsg("result", "За дверью — бумага. И ощущение, что кто-то писал это наспех.", true);
    setTimeout(() => go("sceneHint"), 220);
    return;
  }
}

/* =========================
   СЦЕНЫ ДОМА (ОСТАЛОСЬ КАК БЫЛО)
========================= */
function checkCode(){
  const code = document.getElementById("code2")?.value.trim() || "";
  if (code === "8"){
    setMsg("result2", "Часы вдруг остановились. Дверь в гостиную поддалась…", true);
    setTimeout(() => go("scene3"), 350);
  } else if (!code){
    setMsg("result2", "Нужно ввести число 🙂", false);
  } else {
    setMsg("result2", "Формула не сходится.", false);
  }
}

function found(n){
  foundSet.add(n);
  document.getElementById("foundCount").textContent = `Найдено: ${foundSet.size}/3`;

  if (foundSet.size === 3){
    const r = document.getElementById("result3");
    r.textContent = "Гул складывается в ритм… На пыльном стекле проступает слово: «РЕЗОНАНС».";
    r.className = "ok";

    if (!document.getElementById("toBasementBtn")){
      const btn = document.createElement("button");
      btn.id = "toBasementBtn";
      btn.textContent = "⬇ Спуститься в подвал";
      btn.onclick = () => go("scene4");
      r.appendChild(document.createElement("br"));
      r.appendChild(document.createElement("br"));
      r.appendChild(btn);
    }
  }
}

function basementAction(action){
  const r = document.getElementById("result4");
  const wrap = document.getElementById("basementCodeWrap");

  if (action === "vent"){
    basementRevealed = true;
    r.textContent = "Воздух пошёл ровнее… и на стене проступают бледные буквы.";
    r.className = "ok";
    wrap.style.display = "block";
  } else if (action === "wipe"){
    r.textContent = "Пыль стирается, но стена остаётся пустой. Как будто нужно другое условие…";
    r.className = "bad";
  } else {
    r.textContent = "Тепло быстро уходит в сырость. Буквы не проявляются.";
    r.className = "bad";
  }
}

function checkBasement(){
  const code = document.getElementById("code4")?.value.trim().toLowerCase() || "";
  const r = document.getElementById("result4");

  if (!basementRevealed){
    r.textContent = "Сначала нужно понять, как проявить надпись.";
    r.className = "bad";
    return;
  }

  if (code === "резонанс" || code === "rezonans" || code === "resonance"){
    r.textContent = "В стене щёлкает скрытый механизм. Лестница на чердак освобождена.";
    r.className = "ok";
    setTimeout(() => go("scene5"), 400);
  } else if (!code){
    r.textContent = "Нужно ввести слово 🙂";
    r.className = "bad";
  } else {
    r.textContent = "Не сходится. Буквы будто расплываются… попробуй ещё раз.";
    r.className = "bad";
  }
}

function finalAnswer(a){
  const r = document.getElementById("result5");
  const end = document.getElementById("finalEnd");

  if (a === "mix"){
    r.textContent = "Верно. Здесь и физика, и человеческий мотив, и ощущение мистики — потому что ты не знал причины.";
    r.className = "ok";
    end.style.display = "block";
  } else {
    r.textContent = "Почти, но не хватает одного слоя. Подумай, что тут было одновременно.";
    r.className = "bad";
    end.style.display = "none";
  }
}

function restartGame(){
  foundSet.clear();
  basementRevealed = false;

  document.getElementById("foundCount").textContent = "Найдено: 0/3";
  document.getElementById("result3").textContent = "";
  document.getElementById("result3").className = "";
  document.getElementById("toBasementBtn")?.remove();

  document.getElementById("basementCodeWrap").style.display = "none";
  document.getElementById("code4").value = "";
  document.getElementById("result4").textContent = "";
  document.getElementById("result4").className = "";

  document.getElementById("code2").value = "";
  document.getElementById("result2").textContent = "";
  document.getElementById("result2").className = "";

  document.getElementById("result5").textContent = "";
  document.getElementById("result5").className = "";
  document.getElementById("finalEnd").style.display = "none";

  forumPlayed = false;
  go("scene0");
}
