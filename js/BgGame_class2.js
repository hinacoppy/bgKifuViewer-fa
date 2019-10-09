// BgGame_class.js
'use strict';

class BgGame {
  constructor() {
    this.animDelayOpt = [200,  500, 1000];
    this.waitDelayOpt = [500, 1000, 1500];
    this.animDelay = this.animDelayOpt[1];
    this.waitDelay = this.waitDelayOpt[1];
    this.curRollNo = 0;
    this.autoplay = false;
    this.goForward = false;
    this.controllerProp = "gamestart";
    this.curControlProp = this.controllerProp;
    this.gameCount = 0;
    this.gameLines = [];
    this.matchLength = 0;
    this.curGameNo = 1; //MATファイルオープン後にスタートするゲーム番号
    this.playername = [,,];
    this.score = [,,];
    this.playLength = 0;
    this.cubeBefore = 1; // =2^0
    this.pageTitle = ""; //ex. Kenji Nishizawa vs Takeo Takizawa
    this.matchDescription = ""; //ex. "7 point match"
    this.curGameScore = ""; //ex. 0 - 2
    this.xgidstr = "";
    this.crawford = false;
    this.board = new BgBoard();
    this.playObject = [];
    this.setDomNames();
    this.setEventHandler();
    this.setControllerProp(this.controllerProp);
  } //end of constructor()

  setDomNames() {
    this.pageTitleDisp = $("#pageinfodisp");
    this.gameTitleDisp = $("#gameinfodisp");
    this.matchDataDisp = $("#matchinfodisp");
    this.rollDisp      = $("#rolldisp");
    this.moveDisp      = $("#movedisp");
    this.playerDisp    = [null, $("#p1name"), $("#p2name")];
    this.pipDisp       = [null, $("#p1pip"), $("#p2pip")];
    this.analysisDisp  = $("#analysisresult");

    this.gamesource = $("#gamesource");
    this.gamescript = $("#gamescript");
    this.gameSelect = $("#gameSelect");
    this.moveSelect = $("#playSelect");

    this.animSpeed   = $('[name=animspeed]');
    this.animFlag    = $("#animFlag");
    this.waitFlag    = $("#waitFlag");
    this.urlInputTag = $("#inetKifuURL");
    this.kifuDnDArea = $("#dropzone");

    this.startBtn        = $("#gamestart");
    this.prevPlayBtn     = $("#prevPlayBtn");
    this.nextPlayBtn     = $("#nextPlayBtn");
    this.autoPlayBtn     = $("#autoplayBtn");
    this.goPlayBtn       = $("#playGoBtn");
    this.prevGameBtn     = $("#prevGameBtn");
    this.nextGameBtn     = $("#nextGameBtn");
    this.goGameBtn       = $("#gameGoBtn");
    this.flipHorizBtn    = $("#flipHoriz");
    this.localKifuBtn    = $("#localKifuFile");
    this.internetKifuBtn = $("#urldownload");
    this.analyseBtn      = $("#analyse");

    this.gameController  = $("#prevPlayBtn,#nextPlayBtn,#autoplayBtn,#playSelect,#playGoBtn,#analyse");
    this.matchController = $("#prevGameBtn,#nextGameBtn,#gameSelect,#gameGoBtn");
    this.speedController = $('[name=animspeed]');
  }


  setupGamescript(gamenum) {
    const sc = this.parseGameData(this.gamesource.val(), gamenum);
    if (sc === false) {
      this.setControllerProp("gamestart");
      alert("Game Sourceの解析中にエラーになりました");
      return;
    }
    this.curGameNo = gamenum;
    this.gamescript.val(sc);
    this.initGame();
  }

  initGame() {
    const playo = this.playObject[0];
    this.xgidstr = playo.bfxgid;
    this.board.showBoard(this.xgidstr);

    this.pipDisp[1].text("pip= 167"); // show start(default) value
    this.pipDisp[2].text("pip= 167");
    this.moveDisp.html("&nbsp;");
    this.rollDisp.html("&nbsp;");
    this.curRollNo = 0;
    this.gameTitleDisp.text(this.curGameScore); // show score

    this.setMoveSelection();
    this.setAnimSpeed( this.animSpeed.filter(':checked').val() );
    this.setControllerProp("manualplay");
  }

  setMoveSelection() {
    this.moveSelect.children().remove();
    for (let i = 1; i <= this.playLength; i++) {
    	this.moveSelect.append($('<option>').val(i).text("Roll "+i));
    }
  }

  flipHorizOrientation() {
    this.board.flipHorizOrientation();
  }

  setAnimSpeed(spd) {
    this.animDelay = this.animDelayOpt[spd];
    this.waitDelay = this.waitDelayOpt[spd];
  }

  toggleAutoplay() {
    if (this.autoplay) {
      this.stopAutoplay();
    } else {
      this.startAutoplay();
    }
  }

  startAutoplay() {
    this.autoplay = true;
    this.autoPlayBtn.html("<i class='far fa-pause-circle fa-2x'></i>");
    this.setControllerProp("autoplay");
    this.loopAutoplay();
  }

  stopAutoplay() {
    this.autoplay = false;
    this.autoPlayBtn.html("<i class='far fa-play-circle fa-2x'></i>");
    this.setControllerProp("manualplay");
  }

  async loopAutoplay() {
    while (this.autoplay) {
      await this.gotoPlay(+1);
      if (this.waitFlag.prop("checked")) {
        await BgUtil.sleep(this.waitDelay);
      }
    }
  }

  async gotoPlay(delta) {
    const playnum = this.curRollNo + delta;
    if (playnum < 1 || playnum > this.playLength) {
      this.stopAutoplay();
      return;
    }
    this.goForward = (delta > 0) ? true : false;
    this.moveSelect.val(playnum);
    await this.playMove(playnum);
  }

  jumpToPlay() {
    this.playMove( parseInt(this.moveSelect.val()) );
  }

  async playMove(playnum) {
//console.log("playMove", playnum);
    let rdisp;
    this.curRollNo = playnum;
    const playo = this.playObject[playnum -1];
    this.board.showBoard(playo.bfxgid);
    const playername = this.playername[playo.turn];
    switch (playo.action) {
    case "roll":
      rdisp = playername + " rolled " + playo.dice;
      break;
    case "offer":
      rdisp = playername + " offer double to " + playo.cube;
      break;
    case "take":
      rdisp = playername + " take double to " + playo.cube;
      break;
    case "drop":
      rdisp = playername + " pass the double";
      break;
    default:
      rdisp = playername + " " + playo.action;
      break;
    }
    this.rollDisp.text(rdisp);
    this.moveDisp.text("");
    this.analysisDisp.text("");
    if (this.animFlag.prop("checked") && this.goForward) {
      this.setControllerProp("animation");
      await this.board.animateDice(1000); //ダイスを揺らし、揺れ終わるのを待つ(引数=msec)
      await this.animMove(playnum); //チェッカーを動かし、動き終わるのを待つ
      this.setControllerProp(this.curControlProp);
    } else {
      this.afterMove(playnum)
    }
  }

  afterMove(playnum) {
    const playo = this.playObject[playnum -1];
    const xg = new Xgid(playo.xgid);
    this.board.showBoard2(xg);
    this.pipDisp[playo.turn].text("pip= " + xg.get_pip(xg.turn));
    this.moveDisp.text( playo.move );
  }

  async animMove(playnum) {
    const playo = this.playObject[playnum -1];
    const xgbf = new Xgid(playo.bfxgid);
    const xgaf = new Xgid(playo.xgid);
    const action = playo.action;
    const move = playo.move;

    if (action == "roll" && BgUtil.isContain(move, "/")) {
      const moveary = BgUtil.cleanupMoveStr(move, xgbf.xgidstr);
      for (let n = 0; n < moveary.length; n++) {
        this.moveDisp.html( BgUtil.makeMoveStr(moveary, n) );
        const fromto = moveary[n].split("/");
        await this.board.animateChequer(xgbf, fromto[0], fromto[1], this.animDelay, n);
      }
    } else {
      this.moveDisp.text( move );
      await BgUtil.sleep(this.animDelay);
    }
    this.board.showBoard2(xgaf);
    this.pipDisp[playo.turn].text("pip= " + xgaf.get_pip(xgaf.turn));
//console.log("animMove", playo.turn, xgaf.turn, xgaf.get_pip(xgaf.turn));
  }


  loadLocalKifu(evt) {
    const file = evt.target.files[0];
    if (!file) { return; }
    this.readKifuFile(file);
  }

  draganddropKifu(evt) {
    const file = evt.originalEvent.dataTransfer.files[0];
    if (!file) { return; }
    this.readKifuFile(file);
  }

  readKifuFile(file) {
    this.kifuDnDArea.text(this.inline_trim(file.name));

    const reader = new FileReader();
    reader.readAsText(file); //テキスト形式で読み込む

    //読込終了後の処理
    reader.onload = () => { //アロー関数で記述すれば、thisがそのまま使える
      this.gamesource.val(reader.result); //テキストエリアに表示
      this.getGameSource();
    }
  }

  //AJAXで、棋譜ファイルを取得
  //サーバ内ローカル、インターネットURLの両方に対応
  loadInetKifuAjax(query) {
//console.log("loadInetKifuAjax", query);

    $.ajax({
      url: 'bg_kifu_ajax.php'+query,
      method: 'GET',
      dataType: "text",
    }).done((d) => {
      if (!BgUtil.isContain(d, "ERROR")) {
        this.gamesource.val(d);
        //this.setControllerProp("gameload");
        this.getGameSource();
      } else {
        alert('ERROR in return data:\n' + d);
      }
    }).fail(() => {
      alert('ERROR in AJAX connection');
    });
  }

  //サーバ内の棋譜をロード
  loadServerKifuAjax(query) {
    const file = query.substr("?s=".length);
    const filepath = "/bgKifuViewer-fa/scripts/" + file;
//console.log("loadServerKifuAjax", query, filepath);
    $.ajax({
      url: filepath,
      method: 'GET',
      dataType: "text",
    }).done((d) => {
      if (!BgUtil.isContain(d, "ERROR")) {
        this.kifuDnDArea.text(this.inline_trim(file));
        this.gamesource.val(d);
        this.getGameSource();
      } else {
        alert('ERROR in return data:\n' + d);
      }
    }).fail(() => {
      alert('ERROR in AJAX connection');
    });
  }

  getGameSource() {
    const r = this.parseMatchData(this.gamesource.val()); //ソースを解析しbggコードに変換
    if (r === false) {
      this.setControllerProp("gamestart");
      alert("Game Sourceの解析中にエラーになりました");
      return;
    }

    this.setGameSelection();
    this.showMatchInfo();
    this.setControllerProp("gameload");
    this.curGameNo = 1;
    this.crawford = false;
    this.setupGamescript(this.curGameNo);
  }

  gotoGame(delta) {
    const gamenum = this.curGameNo + delta;
    if (gamenum < 1 || gamenum > this.gameCount) { return; }
    this.gameSelect.val(gamenum);
    this.setupGamescript(gamenum);
  }

  jumpToGame() {
    const gamenum = parseInt(this.gameSelect.val());
    this.setupGamescript(gamenum);
  }

  setControllerProp(situation) {
    this.controllerProp = situation;
    switch(situation) {
    case "gamestart":
      this.gameController.prop("disabled", true);
      this.matchController.prop("disabled", true);
      this.speedController.prop("disabled", true);
      this.flipHorizBtn.prop("disabled", true);
      this.startBtn.prop("disabled", true);
      break;
    case "gameload":
      this.gameController.prop("disabled", true);
      this.matchController.prop("disabled", true);
      this.startBtn.prop("disabled", false);
      break;
    case "manualplay":
      this.flipHorizBtn.prop("disabled", false);
      this.speedController.prop("disabled", false);
      this.gameController.prop("disabled", false);
      this.matchController.prop("disabled", false);
      this.startBtn.prop("disabled", false);
      this.localKifuBtn.prop("disabled", false);
      this.curControlProp = situation;
      break;
    case "autoplay":
      //set disabled property to "true" without this.autoPlayBtn
      this.gameController.prop("disabled", true);
      this.autoPlayBtn.prop("disabled", false);
      this.matchController.prop("disabled", true);
      this.startBtn.prop("disabled", true);
      this.localKifuBtn.prop("disabled", true);
      this.curControlProp = situation;
      break;
    case "animation":
      //unable next/prev button while chequer animation
      this.gameController.prop("disabled", true);
      this.autoPlayBtn.prop("disabled", false);
      break;
    }
  }

  showMatchInfo() {
    this.pageTitleDisp.text(this.pageTitle);
    this.matchDataDisp.text(this.matchDescription);
    this.playerDisp[1].text(this.playername[1]);
    this.playerDisp[2].text(this.playername[2]);
  }

  setGameSelection() {
    this.gameSelect.children().remove();
    for (let i = 1; i <= this.gameCount; i++) {
    	this.gameSelect.append($('<option>').val(i).text("Game "+i));
    }
  }

  parseMatchData(gamesource) {
    let linetrim, line, gamenumberline;

    this.gameLines = [];
    const gamesourceArray = gamesource.split("\n");
    for (let j = 0; j < gamesourceArray.length; j++) {
      line = gamesourceArray[j];
      linetrim = line.trim();
      if (linetrim.match(/point match/)) {
        this.matchDescription = linetrim;
        this.matchLength = linetrim.substr(0, linetrim.indexOf(" "));
      }
      if (line.substr(0,6) == " Game ") {
        this.gameLines.push(j);
        gamenumberline = j;
      }
    }
    this.gameLines.push(gamesourceArray.length); //最後
    this.gameCount = this.gameLines.length - 1;

    if (this.gameCount === 0) {
      alert("Error in parseMatchData - no 'Game' lines in file")
      return false;
    }

    const playernameline = gamesourceArray[gamenumberline + 1];
    const ary = BgUtil.insertStr(playernameline, 32, ":").split(":");
    const playername1  = ary[2].trim();
    const playername2  = ary[0].trim();

    this.pageTitle = playername2 + " vs " + playername1;
    this.playername = [null, playername1, playername2];
  }

  parseGameData(gamesource, gameNo) {
    const gamesourceArray = gamesource.split("\n");
    const gameObj = gamesourceArray.slice(this.gameLines[gameNo-1], this.gameLines[gameNo]);

    const playernameline = gameObj[1]; // Contains player names and score
    const ary = BgUtil.insertStr(playernameline, 32, ":").split(":");
    const scr1 = ary[3].trim();
    const scr2 = ary[1].trim();
    this.curGameScore = scr2 + " - " + scr1;
    this.score = [null, scr1, scr2];

    let op  = "[game][matchdata]MATCHDATA[/matchdata]\n";
    op += "[matchlength " + this.matchLength + "]\n";
    op += "[pagetitle " + this.pageTitle + "]\n";
    op += "[gametitle " + this.curGameScore + "]\n";
    op += "[playername1 " + this.playername[1] + "][playername2 " + this.playername[2] + "]\n";
    op += "[player1score " + this.score[1] + "][playe2score " + this.score[2] + "]\n";

    const blockStart = BgUtil.findLine(gameObj, "1)");
    if (blockStart < 0) {
      alert("Error in parseGameData - no gameplay lines");
      return false;
    }

    // Now create serialised plays array
    const gameBlock = gameObj.slice(blockStart, gameObj.length);
    let plays = [];
    for (let pl of gameBlock) {
      plays.push(pl.substring(5, 33)); //6--33
      plays.push(pl.substring(33));    //34--end
    }
    const playdata = this.parsePlay(plays);
    return op + playdata + "[/game]";
  }

  parsePlay(plays) {
    // Now generate the script from the plays[] elements
    let i = 0, j, k, m, e, opa = "", s1, s2, dc, mv, af, bf, xg, po;

    bf = this.xgidstr = this.firstXgid();
    this.playObject = []; //init _playObject

    for (k of plays) {
      m = "";
      j = (i % 2 == 0) ? 2 : 1;  // Player no for this element

      switch( this.chkAction(k) ) {
      case "ROLL":
        e = k.indexOf(":");
        dc = k.substr(e-2,2);
        mv = k.substr(e+1).trim();
        if (mv == "") { mv = "Cannot Move"; }
        xg = this.nextXgid(bf, j, "roll", dc, "", 0); // ロール後(ムーブ前)のXGIDを計算する(解析(move action)に渡す用)
        af = this.nextXgid(bf, j, "move", dc, mv, 0); // ムーブ後のXGIDを計算する(画面表示用)
        po = this.makePlayObj(j, "roll", dc, mv, 0, xg, af);
        m = "[play][player" + j + "][dice " + dc + "][move " + mv + "][" + xg + "][" + af + "][/play]";
        break;
      case "DOUBLE":
        s1 = k.trim();
        s2 = parseInt(s1.substr(s1.lastIndexOf(" ")));
        xg = this.nextXgid(bf, j, "roll", "00", "", this.cubeBefore); //解析(cube action)に渡す用
        af = this.nextXgid(bf, j, "offer", "D", "", s2); //画面表示用
        po = this.makePlayObj(j, "offer", "D", "", s2, xg, af);
        m = "[play][player" + j + "][command double " + s2 + "][" + xg + "][" + af + "][/play]";
        break;
      case "TAKE":
        af = xg = this.nextXgid(bf, j, "take", "00", "", s2);
        po = this.makePlayObj(j, "take", "00", "", s2, xg, af);
        m = "[play][player" + j + "][command take " + s2 + "][" + xg + "][" + af + "][/play]";
        this.cubeBefore = s2;
        break;
      case "DROP":
        af = xg = this.nextXgid(bf, j, "drop", "00", "", this.cubeBefore);
        po = this.makePlayObj(j, "drop", "00", "", 0, xg, af);
        m = "[play][player" + j + "][command drop][" + xg + "][" + af + "][/play]";
        break;
      case "OTHER":
        this.cubeBefore = 1; // =2^0
        af = xg = this.nextXgid(bf, j, "gameset", "00", "", 0);
        po = this.makePlayObj(j, k.trim(), "00", "", 0, xg, af);
        m = "[play][player" + j + "][command " + k.trim() + "][" + xg + "][" + af + "][/play]";
        break;
      default: // "NULL"
        m = "";
        break;
      }
      if (m != "") {
         opa += m + "\n";
         bf = af; //change XGID for next turn
         this.playObject.push(po);
      }
      i++;
    }
    this.playLength = this.playObject.length;
    return opa
  }

  makePlayObj(tn, ac, dc, mv, cb, xg, af) {
    return {"turn": tn, "action": ac, "dice": dc, "move": mv, "cube": cb, "bfxgid": xg, "xgid": af}; 
  }

  chkAction(play) {
    const p = play.toLowerCase()
    if (BgUtil.isContain(p,""))       { return "NULL"; }
    if (BgUtil.isContain(p,":"))      { return "ROLL"; }
    if (BgUtil.isContain(p,"double")) { return "DOUBLE"; }
    if (BgUtil.isContain(p,"take"))   { return "TAKE"; }
    if (BgUtil.isContain(p,"drop"))   { return "DROP"; }
    return "OTHER";
  }

  firstXgid() {
    const xgid = new Xgid();
    xgid.position = "-b----E-C---eE---c-e----B-";
    xgid.dice = "00";
    xgid.cube = xgid.cubepos = xgid.turn = 0;
    xgid.crawford = this.crawford;
    xgid.sc_me = this.score[1];
    xgid.sc_yu = this.score[2];
    xgid.matchsc = this.matchLength;
    return xgid.xgidstr;
  }

  nextXgid(bf, tn, ac, dc, mv, cb) {
    const xgid = new Xgid(bf);
    xgid.turn = BgUtil.cvtTurnKv2xg(tn);
    switch (ac) {
    case "roll":
      xgid.dice = dc;
      break;
    case "move":
      xgid.dice = dc;
      xgid.position = xgid.moveChequer(xgid.position, mv, xgid.turn);
      break;
    case "offer":
      xgid.cube = BgUtil.calcCubeValRev(cb); // 8 => 3
      xgid.cubepos = BgUtil.cvtTurnKv2xg(BgUtil.getOppo(tn));
      xgid.dbloffer = true;
      break;
    case "take":
      xgid.dbloffer = false;
      break;
    case "drop":
      xgid.cube = BgUtil.calcCubeValRev(cb); // 8 => 3
      xgid.dbloffer = false;
      break;
    case "gameset":
      const sc = BgUtil.calcCubeVal(xgid.cube); // 3 => 8
      const winnerscr = (tn == 1) ? xgid.sc_me : xgid.sc_yu;
      const loserscr  = (tn == 1) ? xgid.sc_yu : xgid.sc_me;
      this.crawford = xgid.checkCrawford(winnerscr, sc, loserscr);
      xgid.dice = "00";
      if (tn == 1) { xgid.sc_me = xgid.sc_me + sc; }
      else         { xgid.sc_yu = xgid.sc_yu + sc; }
      break;
    default:
      break;
    }
    return xgid.xgidstr;
  }

  kbdNavigation(evt) {
    if (evt.keyCode == 37) this.gotoPlay(-1); //←
    if (evt.keyCode == 39) this.gotoPlay(+1); //→
    if (evt.keyCode == 38) this.gotoGame(-1); //↑
    if (evt.keyCode == 40) this.gotoGame(+1); //↓
  }

//AJAX通信により、gnubgによる解析結果を取得する
  async get_gnuanalysis_ajax(xgid) {
console.log("get_gnuanalysis_ajax");
    const num=5, depth=2;
    this.analysisDisp.html('<i class="fas fa-spinner fa-pulse fa-3x" style="color:purple"></i>');
    // $.ajax return promise
    return $.ajax({
      url: 'http://local.example.com/gnubg_ajax.php?g='+xgid+'&d='+depth+'&n='+num, //local PHP script
//      url: 'http://local.example.com:1234/gnubg_ajax.js?g='+xgid, //Node.js
//      url: 'http://ldap.example.com/cgi-bin/gnubg_ajax.cgi?g='+xgid+'&n='+num,
//      url: 'http://local.example.com/cgi-bin/gnubg_ajax.cgi?g='+xgid+'&d='+depth+'&n='+num, //kagoya local
//      url: 'https://v153-127-246-44.vir.kagoya.net:17500/gnubg_ajax.js?g='+xgid+'&d='+depth+'&n='+num, //Node.js
      method: 'GET',
      dataType: "text",
//    }).done((d) => {
//console.log("get_gnuanalysis_ajax-done". d);
    }).fail(() => {
      alert('ERROR in AJAX connection');
    });
  }

  async analyseByGnubg() {
//console.log("analyse_gnubg");
    const playo = this.playObject[this.curRollNo -1];
    let xgid = "XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:0:10";
    if (playo !== void 0) { // playo is not 'undefined'
        xgid = playo.bfxgid;
    }
    let xgidcube = xgid;
    const xg = new Xgid(xgid);
    let chequeractionflg = false, analychequer, analycube;

    if (xg.dice != "00") {
      chequeractionflg = true;
      xg.dice = "00";
      xgidcube = xg.xgidstr;
      //analyse chequer action
      analychequer = await this.get_gnuanalysis_ajax(xgid).catch(() => 'ERROR in AJAX connection\n');
    }
    //analyse cube action
    analycube = await this.get_gnuanalysis_ajax(xgidcube).catch(() => 'ERROR in AJAX connection\n');

    let pre = xgid + "\n";
    pre += "----------------------------------------------------------------------------------\n";
    if (chequeractionflg) {
      pre += analychequer;
      pre += "----------------------------------------------------------------------------------\n";
    }
    pre += analycube;

    this.analysisDisp.text(pre);
  }

  isGithub() {
    const hostname = $(location).attr('host');
    return BgUtil.isContain(hostname, "hinacoppy.github.io");
  }

  inline_trim(str, len = 60) {
    if (str.length < len) { return str; }
    const len2 = Math.floor(len / 2);
    const f = str.substr(0, len2);
    const t = str.substr(-1 * len2);
    return f + "..." + t;
  }

  setEventHandler() {
    // Event handler
    this.prevPlayBtn. on('click', () => { this.gotoPlay(-1); });
    this.nextPlayBtn. on('click', () => { this.gotoPlay(+1); });
    this.autoPlayBtn. on('click', () => { this.toggleAutoplay(); });
    this.goPlayBtn.   on('click', () => { this.jumpToPlay(); });

    this.prevGameBtn. on('click', () => { this.gotoGame(-1); });
    this.nextGameBtn. on('click', () => { this.gotoGame(+1); });
    this.goGameBtn.   on('click', () => { this.jumpToGame(); });
    this.startBtn.    on('click', () => { this.getGameSource(); });
    this.flipHorizBtn.on('click', () => { this.board.flipHorizOrientation(); /*this.flipHorizOrientation();*/ });

    this.speedController.on('change', () => {
      this.setAnimSpeed( this.animSpeed.filter(':checked').val() );
    });

    this.localKifuBtn.on('change', (evt) => { this.loadLocalKifu(evt); });

    this.internetKifuBtn.on('click', () => {
      if (this.isGithub()) {
        alert('Sorry, this feature is inactive.'); //githubで稼働しているときはInternet Kifu参照不可
        return;
      }
      const query = "?u=" + this.urlInputTag.val();
      this.loadInetKifuAjax(query);
    });

    this.analyseBtn.on('click', () => {
      if (this.isGithub()) {
        alert('Sorry, this feature is inactive.'); //githubで稼働しているときはgnubgの解析機能は営業停止
        return;
      }
      this.analyseByGnubg();
      $('#analysisResult > .modalContents').css("max-width", "none");
      $('#analysisResult').fadeIn();
    });

    $(window).on('keydown', (evt) => { this.kbdNavigation(evt); });

    // ページがロードされたときに、query情報があればAJAXで棋譜ファイルを取得する
    const query = $(location).attr('search');
    if (query.startsWith('?s=')) {
      this.loadServerKifuAjax(query);
    } else if (query.startsWith('?u=')) {
      this.loadInetKifuAjax(query);
    }

    this.kifuDnDArea.on('dragenter', (evt) => {
      this.kifuDnDArea.css('border', '2px solid #18a');
      evt.stopPropagation();
      evt.preventDefault();
    });

    this.kifuDnDArea.on('dragover', (evt) => {
       evt.stopPropagation();
       evt.preventDefault();
    });

    this.kifuDnDArea.on('drop', (evt) => {
       this.kifuDnDArea.css('border', '2px dotted #18a');
       evt.preventDefault();
       this.draganddropKifu(evt);
    });

    $(document).on('dragover', (evt) => {
      this.kifuDnDArea.css('border', '2px dotted #18a');
      evt.stopPropagation();
      evt.preventDefault();
    });

    $(document).on('drop', (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
    });

    //モーダル画面の閉じるボタンクリック
    $('#closeResult').on('click', function(e) {
      $('#analysisResult').fadeOut();
    });

  }

} //class BgGame
