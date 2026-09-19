const SUPABASE_URL = "https://majijvacrqurbhhmolkd.supabase.co";
const SUPABASE_KEY = "sb_publishable_IEaMHQDgtj0jMyyokhgZaA_Oav3kgnZ";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentTheme = "";

function selectTheme(theme) {
    currentTheme = theme;
    const themeArea = document.getElementById("theme-area");

    themeArea.innerHTML = `
        <div class="theme-page">

            <h2>${theme}</h2>

            <p>
                このテーマについて思ったことや、
                アイデア、疑問などを自由に共有してください。
            </p>

            <div class="name-area">

                <input
                    type="text"
                    id="name-input"
                    placeholder="名前を入力"
                >

                <label>
                    <input
                        type="checkbox"
                        id="anonymous-check"
                    >
                    匿名で投稿する
                </label>

            </div>

            <textarea
                id="opinion-input"
                placeholder="思ったことを自由に書いてください"
            ></textarea>

            <button onclick="postOpinion()">
                意見を投稿する
            </button>

            <div id="opinion-list"></div>

            <button onclick="backToThemes()">
                ← テーマ一覧に戻る
            </button>

        </div>
        `;

    displayOpinions();
}

function backToThemes() {

    document.getElementById("theme-area").innerHTML = "";

}

async function postOpinion() {

    const input = document.getElementById("opinion-input");
    const nameInput = document.getElementById("name-input");
    const anonymousCheck = document.getElementById("anonymous-check");

    const opinion = input.value;
    let name = nameInput.value;

    if (opinion.trim() === "") {
        alert("意見を入力してください");
        return;
    }

    if (anonymousCheck.checked) {
        name = "匿名";
    }

    if (name.trim() === "") {
        alert("名前を入力するか、匿名にしてください");
        return;
    }

    const { error } = await supabaseClient
        .from("opinions")
        .insert([
            {
                theme: currentTheme,
                name: name,
                opinion: opinion
            }
        ]);

    if (error) {
        console.error(error);
        alert("投稿に失敗しました");
        return;
    }

    alert("投稿しました！");

    input.value = "";
    nameInput.value = "";
    anonymousCheck.checked = false;

    await displayOpinions();
}

async function displayOpinions() {

    const opinionList = document.getElementById("opinion-list");

    if (!opinionList) {
        return;
    }

    opinionList.innerHTML = "読み込み中...";

    const { data, error } = await supabaseClient
        .from("opinions")
        .select("*")
        .eq("theme", currentTheme)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        opinionList.innerHTML = "投稿の読み込みに失敗しました。";
        return;
    }

    opinionList.innerHTML = "";

    data.forEach(function(item) {

        const newOpinion = document.createElement("div");

        newOpinion.className = "opinion-card";

        const date = new Date(item.created_at);

        const likedOpinions =
    JSON.parse(localStorage.getItem("likedOpinions")) || [];

const isLiked = likedOpinions.includes(item.id);

const likeIcon = isLiked ? "♥" : "♡";

const formattedDate = date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

newOpinion.innerHTML = `
    <strong>${item.name}</strong>
    <p>${item.opinion}</p>

    <span class="opinion-date">${formattedDate}</span>

   <div class="opinion-actions">
    <button
        class="like-button"
        onclick="likeOpinion(${item.id}, ${item.likes ?? 0})"
    >
        ${likeIcon} 共感 ${item.likes ?? 0}
    </button>

    <button
        class="reply-button"
        onclick="showReplyForm(${item.id})"
    >
        💬 返信
    </button>
</div>

<div id="reply-form-${item.id}" class="reply-form" style="display: none;">
    <input
        type="text"
        id="reply-name-${item.id}"
        placeholder="名前"
    >

    <label>
        <input
            type="checkbox"
            id="reply-anonymous-${item.id}"
        >
        匿名で返信する
    </label>

    <textarea
        id="reply-input-${item.id}"
        placeholder="返信を入力してください"
    ></textarea>

    <button onclick="postReply(${item.id})">
        返信を投稿する
    </button>
</div>

<div
    id="reply-list-${item.id}"
    class="reply-list"
>
</div>
`;

        opinionList.appendChild(newOpinion);
        opinionList.appendChild(newOpinion);

displayReplies(item.id);
    });
}

async function likeOpinion(id, currentLikes) {

    // このブラウザで共感した投稿IDを取得
    let likedOpinions =
        JSON.parse(localStorage.getItem("likedOpinions")) || [];

    // すでに共感しているか確認
    const alreadyLiked = likedOpinions.includes(id);

    let newLikes;

    if (alreadyLiked) {

        // 共感を取り消す
        newLikes = Math.max(currentLikes - 1, 0);

        likedOpinions = likedOpinions.filter(
            opinionId => opinionId !== id
        );

    } else {

        // 共感する
        newLikes = currentLikes + 1;

        likedOpinions.push(id);
    }

    // Supabaseの共感数を更新
    const { error } = await supabaseClient
        .from("opinions")
        .update({
            likes: newLikes
        })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("共感の送信に失敗しました");
        return;
    }

    // このブラウザに共感状態を保存
    localStorage.setItem(
        "likedOpinions",
        JSON.stringify(likedOpinions)
    );

    await displayOpinions();
}

function showReplyForm(opinionId) {

    const replyForm =
        document.getElementById(`reply-form-${opinionId}`);

    if (replyForm.style.display === "none") {
        replyForm.style.display = "block";
    } else {
        replyForm.style.display = "none";
    }
}


async function postReply(opinionId) {

    const input =
        document.getElementById(`reply-input-${opinionId}`);

    const nameInput =
        document.getElementById(`reply-name-${opinionId}`);

    const anonymousCheck =
        document.getElementById(`reply-anonymous-${opinionId}`);

    const reply = input.value;
    let name = nameInput.value;

    if (reply.trim() === "") {
        alert("返信を入力してください");
        return;
    }

    if (anonymousCheck.checked) {
        name = "匿名";
    }

    if (name.trim() === "") {
        alert("名前を入力するか、匿名にしてください");
        return;
    }

    const { error } = await supabaseClient
        .from("replies")
        .insert([
            {
                opinion_id: opinionId,
                name: name,
                reply: reply
            }
        ]);

    if (error) {
        console.error(error);
        alert("返信の投稿に失敗しました");
        return;
    }

    alert("返信しました！");

    input.value = "";
    nameInput.value = "";
    anonymousCheck.checked = false;

    await displayReplies(opinionId);
}

async function displayReplies(opinionId) {

    const replyList =
        document.getElementById(`reply-list-${opinionId}`);

    if (!replyList) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("replies")
        .select("*")
        .eq("opinion_id", opinionId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        replyList.innerHTML = "返信の読み込みに失敗しました。";
        return;
    }

    replyList.innerHTML = "";

    data.forEach(function(item) {

        const replyCard = document.createElement("div");
        replyCard.className = "reply-card";

        const date = new Date(item.created_at);

        const formattedDate = date.toLocaleString("ja-JP", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        replyCard.innerHTML = `
            <strong>${item.name}</strong>
            <p>${item.reply}</p>
            <span class="opinion-date">${formattedDate}</span>
        `;

        replyList.appendChild(replyCard);
    });
}