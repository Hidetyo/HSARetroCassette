
let nes = new Nes();
let audioHandler = new AudioHandler();
let paused = false;
let loaded = false;
let pausedInBg = false;
let loopId = 0;
let loadedName = "";
let muted = true;

let c = el("output");
c.width = 256;
c.height = 240;
let ctx = c.getContext("2d");
let imgData = ctx.createImageData(256, 240);

let controlsP1 = {
  arrowright: nes.INPUT.RIGHT,
  arrowleft: nes.INPUT.LEFT,
  arrowdown: nes.INPUT.DOWN,
  arrowup: nes.INPUT.UP,
  enter: nes.INPUT.START,
  shift: nes.INPUT.SELECT,
  a: nes.INPUT.B,
  z: nes.INPUT.A
}
let controlsP2 = {
  l: nes.INPUT.RIGHT,
  j: nes.INPUT.LEFT,
  k: nes.INPUT.DOWN,
  i: nes.INPUT.UP,
  p: nes.INPUT.START,
  o: nes.INPUT.SELECT,
  t: nes.INPUT.B,
  g: nes.INPUT.A
}

zip.workerScriptsPath = "lib/";
zip.useWebWorkers = false;

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    audioHandler.stop();
  } else {
    audioHandler.start();
}
});

el("gamestart").onclick = function (e) {
  const filePath = "ravinaviFinal.nes";

  fetch(filePath)
    .then(response => response.arrayBuffer())
    .then(data => {
      let arr = new Uint8Array(data);
      let parts = filePath.split("/");
      let name = parts[parts.length - 1];
      loadRom(arr, name);
    })
    .catch(error => {
      console.error("ファイルを読み込めませんでした。", error);
    });
}


el("pause").onclick = function (e) {
  if (paused && loaded) {
    loopId = requestAnimationFrame(update);
    //audioHandler.start();
    paused = false;
    el("pause").innerText = "Pause";
  } else {
    cancelAnimationFrame(loopId);
    //audioHandler.stop();
    paused = true;
    el("pause").innerText = "Unpause";
  }
}

el("reset").onclick = function (e) {
  nes.reset(false);
}

el("hardreset").onclick = function (e) {
  nes.reset(true);
}

el("runframe").onclick = function (e) {
  if (loaded) {
    runFrame();
  }
}

document.onvisibilitychange = function (e) {
  if (document.hidden) {
    pausedInBg = false;
    if (!paused && loaded) {
      el("pause").click();
      pausedInBg = true;
    }
  } else {
    if (pausedInBg && loaded) {
      el("pause").click();
      pausedInBg = false;
    }
  }
}

window.onpagehide = function (e) {
  saveBatteryForRom();
}

function loadRom(rom, name) {
  saveBatteryForRom();
  if (nes.loadRom(rom)) {
    // load the roms battery data
    let data = localStorage.getItem(name + "_battery");
    if (data) {
      let obj = JSON.parse(data);
      nes.setBattery(obj);
      log("Loaded battery");
    }
    nes.reset(true);
    if (!loaded && !paused) {
      loopId = setInterval(update, 16.6);
      audioHandler.start();
    }
    loaded = true;
    loadedName = name;
  }
}

function saveBatteryForRom() {
  // save the loadedName's battery data
  if (loaded) {
    let data = nes.getBattery();
    if (data) {
      try {
        localStorage.setItem(loadedName + "_battery", JSON.stringify(data));
        log("Saved battery");
      } catch (e) {
        log("Failed to save battery: " + e);
      }
    }
  }
}

let previousTimestamp = 0;
const targetFrameRate = 600; // 目標のフレームレート
const update = () => {
  runFrame();
}




function runFrame() {
  nes.runFrame();
  nes.getSamples(audioHandler.sampleBuffer, audioHandler.samplesPerFrame);
  audioHandler.nextBuffer();
  nes.getPixels(imgData.data);
  ctx.putImageData(imgData, 0, 0);
}

function log(text) {
  el("log").innerHTML += text + "<br>";
  el("log").scrollTop = el("log").scrollHeight;
}

function el(id) {
  return document.getElementById(id);
}



window.onkeydown = function (e) {
  if (controlsP1[e.key.toLowerCase()] !== undefined) {
    nes.setButtonPressed(1, controlsP1[e.key.toLowerCase()]);
    e.preventDefault();
  }
  if (controlsP2[e.key.toLowerCase()] !== undefined) {
    nes.setButtonPressed(2, controlsP2[e.key.toLowerCase()]);
    e.preventDefault();
  }
}

window.onkeyup = function (e) {
  if (controlsP1[e.key.toLowerCase()] !== undefined) {
    nes.setButtonReleased(1, controlsP1[e.key.toLowerCase()]);
    e.preventDefault();
  }
  if (controlsP2[e.key.toLowerCase()] !== undefined) {
    nes.setButtonReleased(2, controlsP2[e.key.toLowerCase()]);
    e.preventDefault();
  }
  if (e.key.toLowerCase() === "m" && loaded) {
    let saveState = nes.getState();
    try {
      localStorage.setItem(loadedName + "_savestate", JSON.stringify(saveState));
      log("Saved state");
    } catch (e) {
      log("Failed to save state: " + e);
    }
  }
  if (e.key.toLowerCase() === "n" && loaded) {
    let data = localStorage.getItem(loadedName + "_savestate");
    if (data) {
      let obj = JSON.parse(data);
      if (nes.setState(obj)) {
        log("Loaded state");
      } else {
        log("Failed to load state");
      }
    } else {
      log("No state saved yet");
    }
  }
}

el("LButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.LEFT);
});
el("LButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.LEFT);
});

el("RButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.RIGHT);
});
el("RButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.RIGHT);
});

el("UButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.UP);
});
el("UButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.UP);
});

el("DButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.DOWN);
});
el("DButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.DOWN);
});

el("SButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.START);
});
el("SButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.START);
});

el("AButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.A);
});
el("AButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.A);
});

el("BButton").addEventListener('touchstart', () => {
  nes.setButtonPressed(1, nes.INPUT.B);
});
el("BButton").addEventListener('touchend', () => {
  nes.setButtonReleased(1, nes.INPUT.B);
});

