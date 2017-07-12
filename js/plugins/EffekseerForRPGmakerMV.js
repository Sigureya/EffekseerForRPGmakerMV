//=============================================================================
// EffekseerForRPGmakerMV.js
// ----------------------------------------------------------------------------
// Copyright (c) 2017-2017 Sigureya
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 0.9.0 2017/05/18 初版 
// ----------------------------------------------------------------------------
// [Twitter]: https://twitter.com/Sigureya/
//=============================================================================

/*:
 * @plugindesc 『Effekseer』forツクールMV(エフェクトツール)
 * 
 * @author しぐれん（魔のささやき）
 * 
 * 
 * @help
 * 「Effekseer」で作成したエフェクトをそのままツクール上で再生します。
 * 以下の順序でプラグインを入れてください。
 * effekseer_min.js
 * pixiEffekseer.js
 * effekseerMV.js
 * 
 * 一部の環境では動きません。
 * ・RPGアツマール
 * 　.efkファイルをアップできないので不可。
 * ・ブラウザ実行(Safari)
 * 　ES5に対応していない環境では不可。
 * 
 * var 1.0(2017/5/18) 公開
 * 
 * 
 * ここから先は、プラグイン作成者向けの競合向け情報です。
 * 作成したSprite_EffekseerはSprite_Animationのフリをして動きます。
 * 大体同じような場所に格納されます。
 * Sprite_Base.animationSpritesに格納されていることがあるので、
 * 何かあったら、探ってみてください。
 */
/**
 * TODO 
 * フィールドで、正面に向けて発射するヤツ
 * 終了したら、自分で勝手に消える機能。
 * 
 * ツクールのウィンドウでEffekseerを出した場合、
 * +Y=UP/-Y=DOWN
 * 画面内に収まる数値は、±(Graphics.boxHeight/2)の範囲
 * 完全一致させるには、カメラ系の行列の再設定が必要
 * 
 * アニメーション再生中はwaitの処理がうまく行かない。
 * １回目だけうまく行くけど、２回目以降は早い段階で切れてしまう。
 * Sprite_Base.prototype.updateAnimationSpritesにブレークポイントを張り、
 * sprite.isPlayingがfalseだった時を見ているが、
 * 音が鳴る前に終了扱いにされている。
 */



(function(global){
     'use strict'
     const effekseerStr = 'effekseer';

    const xxx={
        commandKey :'key',
        commandName:'エフェクトテスト',
    };

class Sprite_Effekseer extends PIXI.EffekseerEmitter{
    constructor(path){
        super(path);
        this._target =null;
        this._user=null;
        this._frame =0;
    }
    // isPlayingと合わせて、Sprite_Animationのふりをするための処理
    remove(){
        console.log('remove:'+this._frame);
        if(this.parent){
            this.parent.removeChild(this);
        }
    }


    _update(){
        super._update();
        this._frame +=1;
    }
    // 嘘実装
    isPlaying(){
        return this._frame <90;
    }
    setTargetBattler(battler){
        this._target =battler;
    }


};

class EffekseerRenderer_ForRPGmakerMV extends PIXI.EffekseerRenderer{
    constructor(){
        super();
    }

};

class EffekseerManagerClass  {



  toFilePath(name){
    return 'Resource/'+name +'.efk';
  }
  
  update(){}
};
const Scene_Base_create=Scene_Base.prototype.create;
Scene_Base.prototype.create = function(){
    Scene_Base_create.call(this);
    this._effekseerLayer=new Sprite();
};

const Scene_Base_createWindowLayer =Scene_Base.prototype.createWindowLayer;
Scene_Base.prototype.createWindowLayer =function(){
    Scene_Base_createWindowLayer.call(this);
    this.createEffekseerLayer();
};
Scene_Base.prototype.createEffekseerLayer =function(){
    if(effekseerRendererObject){        
        this.addChild(effekseerRendererObject);
    }
    if(this._effekseerLayer){
        this.addChild(this._effekseerLayer);
    }
};

// これ、何かに使うかもしれない
// scene_battleはこれ必須？
Scene_Base.prototype.addEFK=function(efk){
    this._effekseerLayer.addChild(efk);

};

const Scene_Base_update=Scene_Base.prototype.update;
Scene_Base.prototype.update =function(){
    EffekseerManager.update();
    Scene_Base_update.call(this);
};


const EffekseerManager = new EffekseerManagerClass();
const effekseerRendererObject = new EffekseerRenderer_ForRPGmakerMV();
const zz_Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages= function() {
    zz_Scene_Boot_loadSystemImages.apply(this,arguments);
    effekseer.init(Graphics._renderer.gl);
};
Sprite_Base.prototype.startEffekseer =function(efk){
    this.parent.addChild(efk);
    this._animationSprites.push(efk);
};

//--Character--//
const Game_CharacterBase_initMembers =Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function(){
    Game_CharacterBase_initMembers.call(this);
    this._effekseer=null;
};
Game_CharacterBase.prototype.startEffekseer =function(){
    this._effekseer=null;
    this._animationPlaying=true;
};

Game_CharacterBase.prototype.requestEffekseer =function(name){
    this._effekseer=name;
};
Game_CharacterBase.prototype.isEffekseerPlaying =function(){
    return this._effekseer !==null || this._animationPlaying;
};

const Sprite_Character_update= Sprite_Character.prototype.update;
Sprite_Character.prototype.update= function(){
    Sprite_Character_update.call(this);
    this.updateEffekseer();
};
Sprite_Character.prototype.setupEffekseer=function(){
    if(this._character._effekseer){
        const path = EffekseerManager.toFilePath( this._character._effekseer );
        const efk = new Sprite_Effekseer(path);
        efk.setPosition(this.x,this.y);
        this.startEffekseer ( efk);
        this._character.startEffekseer();
    }
};
Sprite_Character.prototype.updateEffekseer=function(){
    this.setupEffekseer();
};

const Game_Interpreter_updateWaitMode =Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode =function(){
    var result =false;
    if(this._waitMode ===effekseerStr){
        result =  this._character.isEffekseerPlaying();
        if(!result){
            this._waitMode ='';
        }
        return result;
    }
    return  Game_Interpreter_updateWaitMode.call(this) ;
};

Game_Interpreter.prototype.effekseerNew =function(name,character,needWait){
    this._character =character;

    character.requestEffekseer( name);
    if(needWait){
        this.setWaitMode( effekseerStr );
    }
};


const Game_Interpreter_pluginCommand=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {

    if(command ==='effekseer'){
        const name = args[0];
        switch (name) {
            case 'new':
            this.effekseerNew(args[1],this.character(Number(args[2])),args[3]==='wait' );
                break;
        
            default:
                break;
        }
    }else{
        Game_Interpreter_pluginCommand.apply(this,arguments);
    }
};
const effektList =[
    'Laser01',
    'Laser02',
    'block',
    'Simple_Ribbon_Parent',
    'Simple_Ribbon_Sword',
    'Simple_Ring_Shape1',
    'Simple_Sprite_FixedYAxis',
    'Simple_Track1',
];

class Window_efkSelect extends Window_Command{
    constructor(x,y,w,h){
        super(x,y);
    }
    makeCommandList(){
        for(var i=0; i < effektList.length; ++i){
            this.addCommand(effektList[i],'Resource/'+effektList[i]+'.efk' );
        }
    }
    windowWidth(){
        return 360;
    }
};




class Scene_EffekseerTest extends Scene_ItemBase{
    constructor(){
        super();
        this._effect =[];
        this.count=0;
    }
    createEnemy(){
        this._rootSprite =new Sprite_Base();
        var width = Graphics.boxWidth;
        var height = Graphics.boxHeight;
        var x = (Graphics.width - width) / 2;
        var y = (Graphics.height - height) / 2;
        this._rootSprite.setFrame(x,y,width,height);

        this._enemy=new Game_Enemy(1,600,300);
        this._enemySprite=new Sprite_Enemy(this._enemy);
        this._rootSprite.addChild(this._enemySprite);
        this.addChild(this._rootSprite);
    }
    create(){
        super.create();
        this.createEffectSelectWindow();
//        this.createEnemy();
    }

    createEffectSelectWindow(){
        const wc = new Window_efkSelect(0,0,400,400);
        wc.makeCommandList();

        wc.activate();
        wc.setHandler('ok',this.onEffectOK.bind(this));
        wc.setHandler( 'cancel',this.popScene.bind(this) );
        this.addWindow(wc);
        this._effectSelectWindow =wc;
    }

    onEffectOK(){
        this._effectSelectWindow.activate();
        const fileName = this._effectSelectWindow.currentSymbol();
        const efk = new Sprite_Effekseer(fileName);
        this.addEFK(efk);
    }
};




const zz_MA_sceneBase_Window_MenuCommand_addOriginalCommands=Window_MenuCommand.prototype.addOriginalCommands;
Window_MenuCommand.prototype.addOriginalCommands =function(){
    zz_MA_sceneBase_Window_MenuCommand_addOriginalCommands.call(this);
    this.addCommand( xxx.commandName,xxx.commandKey,true);
};

const zz_MA_sceneBase_Scene_Menu_createCommandWindow=Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
    zz_MA_sceneBase_Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler(xxx.commandKey, this.commandBattleHistory.bind(this) );

};

//アクター一人を選択する場合のみ、ここを有効にする
const zz_MA_scene_Scene_Menu_onPersonalOk=Scene_Menu.prototype.onPersonalOk;
Scene_Menu.prototype.onPersonalOk =function(){
    if( this._commandWindow.currentSymbol() ===xxx.commandKey  ){
        console.log('nnn');
        SceneManager.push(_Scene_);
    }else{
        zz_MA_scene_Scene_Menu_onPersonalOk.call(this);
    }
}


Scene_Menu.prototype.commandBattleHistory = function(){
        SceneManager.push(Scene_EffekseerTest);
};

Game_Battler.prototype.effekseerTargetPosition =function(){
    return {
        x:this._screenX,
        y:this._screenY,
    };
};

//--Battler--//
const Game_Battler_initMembers=Game_Battler.prototype.initMembers;
Game_Battler.prototype.initMembers =function(){
    Game_Battler_initMembers.call(this);
    this._effekseer=[];

};
Game_Battler.prototype.shiftEffekseerAnimation =function(){
    return this._effekseer.shift();
};

Game_Battler.prototype.clearEffekseerAnimations = function() {
    this._effekseer = [];
};
Game_Battler.prototype.isEffekseerAnimationRequested =function(){
    return this._effekseer.length >0;
};

Game_Battler.prototype.startEffekseerAnimation =function(efkName){
    const data = {
        name :efkName,
    };
    this._effekseer.push(data);
};
const Sprite_Battler_updateAnimation=Sprite_Battler.prototype.updateAnimation;

Sprite_Battler.prototype.updateAnimation =function(){
    Sprite_Battler_updateAnimation.call(this);
    this.updateEffekseer();
};
Sprite_Battler.prototype.updateEffekseer =function(){
    this.setupEffekseer();

};

Sprite_Battler.prototype.setupEffekseer =function(){
    while(this._battler.isEffekseerAnimationRequested()){
        const e = this._battler.shiftEffekseerAnimation();
        const efk = new Sprite_Effekseer(e.name);
        efk.setPosition(this.x,this.y);
        this.startEffekseer(efk);
    }

};


//完全再定義　最終的に別ファイルに仕分ける
Window_BattleLog.prototype.startAction = function(subject, action, targets) {
    var item = action.item();
    this.push('performActionStart', subject, action);
    this.push('waitForMovement');
    this.push('performAction', subject, action);
    this.push('showEffekseerAnimation',action,targets);
    this.push('showAnimation', subject, targets.clone(), item.animationId);
    this.displayAction(subject, item);
};

const BattleManager_isBusy =BattleManager.isBusy;
BattleManager.isBusy = function(){
    return BattleManager_isBusy.call(this) || false;
};

Window_BattleLog.prototype.showEffekseerAnimation=function(action,targets){
    const item = action.item();
    if(item.meta.effekseer){
        const path = EffekseerManager.toFilePath(item.meta.effekseer);
        targets.forEach(function(battler) {
            battler.startEffekseerAnimation(path);
        }, this);
    }
};


if(!Array.prototype.find){
Array.prototype.find =function(func){
    for(var i=0;i < this.length; i+=1){
        if( func( this[i])){
            return this[i];
        }
    }
    return undefined;
};
}


})(this);
