// ======================================
// Minefun Recorder Pro V2 Lite
// Part 1
// ======================================

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

const statusText = document.getElementById("status");
const timerText = document.getElementById("time");
const sizeText = document.getElementById("size");

const resolution = document.getElementById("resolution");
const fps = document.getElementById("fps");
const bitrate = document.getElementById("bitrate");
const audio = document.getElementById("audio");
const lite = document.getElementById("lite");

const filename = document.getElementById("filename");

// 保存ダイアログ
const saveDialog = document.getElementById("saveDialog");
const preview = document.getElementById("preview");

const saveBtn = document.getElementById("saveBtn");
const discardBtn = document.getElementById("discardBtn");
const closeBtn = document.getElementById("closeBtn");

const saveName = document.getElementById("saveName");
const finalTime = document.getElementById("finalTime");
const finalSize = document.getElementById("finalSize");

let recorder = null;
let stream = null;
let recordedBlob = null;
let chunks = [];

let timer = null;
let seconds = 0;

function formatTime(sec){

    const m = String(
        Math.floor(sec/60)
    ).padStart(2,"0");

    const s = String(
        sec%60
    ).padStart(2,"0");

    return `${m}:${s}`;

}

function updateTimer(){

    seconds++;

    timerText.textContent =
        formatTime(seconds);

    // 3秒ごとだけサイズ更新
    if(seconds%3===0){

        const estimate =
        (
            seconds *
            Number(bitrate.value) /
            8
        )/1000000;

        sizeText.textContent =
        estimate.toFixed(1)+" MB";

    }

}

async function startRecording(){

    chunks=[];

    recordedBlob=null;

    seconds=0;

    timerText.textContent="00:00";
    sizeText.textContent="0 MB";

    saveDialog.classList.add("hidden");

    let video={

        frameRate:Number(fps.value)

    };

    switch(resolution.value){

        case "1080":

            video.width=1920;
            video.height=1080;

            break;

        case "720":

            video.width=1280;
            video.height=720;

            break;

        case "480":

            video.width=854;
            video.height=480;

            break;

    }

    try{

        stream=
        await navigator.mediaDevices.getDisplayMedia({

            video,

            audio:audio.checked

        });

        let options={

            videoBitsPerSecond:
            Number(bitrate.value)

        };

        // Chromebook軽量モード
        if(
            lite.checked &&
            MediaRecorder.isTypeSupported(
                "video/webm;codecs=vp8"
            )
        ){

            options.mimeType=
            "video/webm;codecs=vp8";

        }
        else if(
            MediaRecorder.isTypeSupported(
                "video/webm;codecs=vp9"
            )
        ){

            options.mimeType=
            "video/webm;codecs=vp9";

        }

        recorder=
        new MediaRecorder(
            stream,
            options
        );

        recorder.ondataavailable=e=>{

            if(
                e.data &&
                e.data.size>0
            ){

                chunks.push(
                    e.data
                );

            }

        };
              recorder.onstop = () => {

            clearInterval(timer);

            recordedBlob = new Blob(
                chunks,
                {
                    type: recorder.mimeType || "video/webm"
                }
            );

            const url =
                URL.createObjectURL(recordedBlob);

            preview.src = url;
            preview.load();

            saveName.value =
                filename.value.trim() ||
                "recording";

            finalTime.textContent =
                formatTime(seconds);

            finalSize.textContent =
                (
                    recordedBlob.size /
                    1024 /
                    1024
                ).toFixed(2) + " MB";

            saveDialog.classList.remove(
                "hidden"
            );

            statusText.textContent =
                "録画完了";

            startBtn.disabled = false;
            stopBtn.disabled = true;

            if(stream){

                stream
                .getTracks()
                .forEach(track=>track.stop());

            }

        };

        // 超軽量版
        // 1秒ごとにデータを渡さず、
        // 停止時にまとめて受け取る
        recorder.start();

        timer = setInterval(
            updateTimer,
            1000
        );

        statusText.textContent =
            "録画中";

        startBtn.disabled = true;
        stopBtn.disabled = false;

    }
    catch(err){

        console.error(err);

        alert(
            err.name +
            "\n\n" +
            err.message
        );

    }

}

function stopRecording(){

    if(
        recorder &&
        recorder.state==="recording"
    ){

        recorder.stop();

    }

}
// ======================================
// Minefun Recorder Pro V2 Lite
// Part 3
// ======================================

// 保存
saveBtn.onclick = () => {

    if(!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
        (saveName.value.trim() || "recording") +
        ".webm";

    document.body.appendChild(a);

    a.click();

    a.remove();

    setTimeout(() => {

        URL.revokeObjectURL(url);

    },1000);

    // プレビューも解放
    if(preview.src){

        URL.revokeObjectURL(preview.src);

    }

    preview.removeAttribute("src");
    preview.load();

    recordedBlob = null;
    chunks = [];

    saveDialog.classList.add("hidden");

    statusText.textContent = "保存完了";

};

// 保存しない
discardBtn.onclick = () => {

    if(preview.src){

        URL.revokeObjectURL(preview.src);

    }

    preview.removeAttribute("src");

    preview.load();

    recordedBlob = null;

    chunks = [];

    saveDialog.classList.add("hidden");

    statusText.textContent = "保存しませんでした";

};

// 閉じる
closeBtn.onclick = () => {

    saveDialog.classList.add("hidden");

};

// 録画開始
startBtn.onclick = () => {

    startRecording();

};

// 録画停止
stopBtn.onclick = () => {

    stopRecording();

};

// ページ終了
window.onbeforeunload = () => {

    if(
        recorder &&
        recorder.state === "recording"
    ){

        recorder.stop();

    }

    if(stream){

        stream
        .getTracks()
        .forEach(track => track.stop());

    }

    if(preview.src){

        URL.revokeObjectURL(preview.src);

    }

};
