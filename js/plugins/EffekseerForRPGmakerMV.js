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
 * @param MaximumDuration
 * @type number
 * @desc 最大再生時間。これを超えた場合、途中でも描画を打ち切ります。
 * @default 300
 * 
 * @help
 * 「Effekseer」で作成したエフェクトをそのままツクール上で再生します。
 * 以下の順序でプラグインを入れてください。
 * effekseer_min.js
 * pixiEffekseer.js
 * EffekseerForRPGmakerMV.js
 * EffekseerMV_Config.js
 *
 * Window_BattleLog.prototype.startAction()を再定義して上書きしています。
 * この関数を呼ぶほかのプラグインを使用している場合、少し改造が必要です。
 * this.push('showEffekseerAnimation',action,targets)を
 * push('showAnimation')の上に置けばOKです。
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
 * 
 * @param EnemyOffset
 * @desc
 * @type struct<Vec2>[]
 * 
 */
 /*~struct~Vec2:
 * @param x
 * @type number
 * @min -10000
 * @max 10000
 * @desc 指定値分、横方向に中心座標を動かします。
 * 数値を大きくするほど、中心が右に移動します。
 * @default 0
 * 
 * @param y
 * @type number
 * @min -10000
 * @max 10000
 * @desc 指定値分、縦方向に中心座標を動かします。
 * 数値を大きくするほど、中心が下に移動します。
 * @default 0
 * 
 * @param image
 * @type number
 * @type file
 * @dir img/enemies
 */

(function(global){
'use strict'
const effekseerStr = 'effekseer';

const offset_list ={};

const root_directory ='Resource/';

function getEnemyOffset(bitmapName){
    const offset = offset_list[bitmapName];
    if(offset){
        return new Vector2(offset.x,offset.y);
    }
    return new Vector2();
}



class Sprite_Effekseer extends PIXI.EffekseerEmitter{
    constructor(path){
        super(path);
        this._frame =0;
    }
    remove(){
        if(this.parent){
            this.parent.removeChild(this);
        }
    }
    _update(){
        this._frame+=1;
        super._update();
    }

    isPlaying(){
        return  this.exists();
    }
};

class EffekseerRenderer_ForRPGmakerMV extends PIXI.EffekseerRenderer{
    constructor(){
        super();
    }
};

class Vector2{
    constructor(x,y){
        this.x = Number(x ||0);
        this.y = Number(y ||0);
    }
    
    sub(v){
        this.x -=v.x;
        this.y -=v.y;
    }
    add(v){
        this.x +=v.x;
        this.y += v.y;
    }
    dot(v){
        return this.x *v.x + this.y * v.y;
    }
    lengthSQ(){
        return this.dot(this);
    }
    length(){
        return Math.sqrt( this.lengthSQ() );
    }
    normalize(){
        const len = this.length();
        this.x /=len;
        this.y /=len;
    }
    normalized(){
        var v = new Vector2(this.x,this.y);
        v.normalize();
        return v;
    }

    clone(){
        return new Vector2(this.x,this.y);
    }
    // 単位ベクトル化されているなら、各軸にasin/acosしたもの返す
    toRadian(){
        var v = this.clone();
        v.x = 180/Math.acos(v.x);
        v.y = 180/Math.asin(v.y );
        return v;
    }
    atan2(){
        return Math.atan2(this.y,this.x);
    }
};


/**
* @param {String} path filePath
* @param {EffekseerCreateParamater} param Y value of target location
* @return {Sprite_Effekseer} 
*/
function factoryCreateNormal(path,param){
    const efk =new Sprite_Effekseer(path);
    const pos = param.getTargetPosition();
    efk.setPosition(pos.x,pos.y );
    return efk;
}
/**
* @param {String} path filePath
* @param {EffekseerCreateParamater} param Y value of target location
* @return {Sprite_Effekseer} 
*/
function factoryCreateAim(path,param){
    var v1 = param.getTargetPosition();
    
    var v2 = param.getUserPosition();
    const dirV = v1.clone();
    dirV.sub(v2);
    dirV.normalize();

    const radian = dirV.toRadian();
    const r = dirV.atan2();
    var efk = new Sprite_Effekseer(path);
    efk.setRotation(r,90,0);
    efk.setPosition(v2.x,v2.y);
    return efk;
}

function toEffekseerFilePath(name){
    return root_directory+'/'+name +'.efk';
}

class EffekseerFactoryItem{
    /**
     * Set the scale of this effect instance.
     * @param {String} path effekseerFilePath(相対パス)
     * @param {Function} func onCreateCallBackFunction;
     */
    constructor(path,func){
        this._path =path;
        this._loadFunction= func || function(path,param){
            return factoryCreateNormal(path,param);
        };
    }
    /** 
    * @param {EffekseerCreateParamater} param
    */
    create(param){
        return this._loadFunction(this._path,param);
    }
};

class EffekseerCreateParamater{


    /**
	* Set the target location of this effect instance.
	* @param {String} key 
	* @param {Game_Action} action 
	* @param {Game_Battler[]} targets 
	*/
    constructor(key,action){
        this.key = String(key);
        this.action =action;
        this.targetSprite=null;
        
        this.targetPosition = new Vector2(0,0);
        this.targetOffest=new Vector2(0,0);
        
        this.userPosition = new Vector2(0,0);
        this.userOffest=new Vector2(0,0);

    }
    getUserPosition(){
        return new Vector2(this.userPosition.x,this.userPosition.y);
    }

    setUserPosition(pos){
        this.userPosition.x =pos.x;
        this.userPosition.y =pos.y;
    }
    setUserOffset(pos){
        this.userOffest.x = pos.x;
        this.userOffest.y = pos.y;
    }
    setTargetPosition(pos){
        this.targetPosition.x =pos.x;
        this.targetPosition.y =pos.y;
    }
    setTargetOffset(pos){
        this.targetOffest.x = pos.x;
        this.targetOffest.y = pos.y;
    }
    getTargetPosition(){
        var v = new Vector2(this.targetPosition.x,this.targetPosition.y);
        v.add(this.targetOffest);
        return v;
    }
    getTargetOrigin(){
        return this.targetPosition;
    }
};


class EffekseerManagerClass  {
    constructor(){
        this._factoryTable={};
    }
    addNormal(key,fullPath){
        console.log(fullPath);
        this._factoryTable[key]=new EffekseerFactoryItem(
            fullPath,
            factoryCreateNormal
        );
    }

    addTargetAim(key,fullPath){
        this._factoryTable[key]=new EffekseerFactoryItem(
            fullPath,
            factoryCreateAim
        );
    }
  /**
	* @param {String} key
	* @return {EffekseerFactoryItem} 
	*/
    fetchFactoryItem(key){
        return this._factoryTable[key];
    }



  /**
    * @param {String} key
    * @param {EffekseerCreateParamater} param
    
	* @return {Sprite_Effekseer} 
	*/
    createEffekseer(param){
        // メモ 特殊な処理をする場合だけ、factoryを呼びだす
        // それ以外の場合、デフォルト処理で敵の真上に出すだけ
        const item = this.fetchFactoryItem(param.key);
        if(item){
            return item.create(param);
        }
        return factoryCreateNormal(
            toEffekseerFilePath(param.key),
            param
        );


        throw new Error("effect作り損ねた key:"+param.key);
        return null;
    }
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
};



const EffekseerManager = new EffekseerManagerClass();
const effekseerRendererObject = new EffekseerRenderer_ForRPGmakerMV();
const zz_Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages= function() {
    zz_Scene_Boot_loadSystemImages.apply(this,arguments);
    effekseer.init(Graphics._renderer.gl);
};
const Scene_Map_create =Scene_Map.prototype.create;
Scene_Map.prototype.create =function(){
    Scene_Map_create.call(this);
    const offset_list = PluginManager.parameters('EffekseerForRPGmakerMV');
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
        const param = new EffekseerCreateParamater(this._character._effekseer);
        const efk = EffekseerManager.createEffekseer(param);
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

/**
* @param {String} name
* @param {Game_CharacterBase} character
* @param {boolean} needWait 
*/
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


class BattlerToSpriteClass{
    constructor(){
        this.clear();
    }
    toSptire(battler){
        const index = battler.index();
        if(battler.isEnemy()){
            return this._enemy[index];
        }
        if(battler.isActor()){
            return this._actor[index];
        }
        return null;
    }

    fetchEnemies(spriteset_battle){
        spriteset_battle._enemySprites.forEach(
            function(enemySprite){
                const index = enemySprite._enemy.index();
                this._enemy[index] =enemySprite;

            }.bind(this)
        );
    }
    fetchActors(spriteset_battle){
        spriteset_battle._actorSprites.forEach(
            function(actorSprite){
                if(actorSprite._actor){
                    const index = actorSprite._actor.index();
                    this._actor[index] =actorSprite;
                }
            }.bind(this)
        );        
    }

    reset(spriteset_battle){
        this.clear();
        this.fetchEnemies(spriteset_battle);
        this.fetchActors(spriteset_battle);
    }
    clear(){
        this._enemy =[];
        this._actor=[];
    }
}
const BattlerToSpriteTable =new  BattlerToSpriteClass();
function BattlerToSprite (battler){
   return BattlerToSpriteTable.toSptire(battler);
}

const Scene_Battle_create =Scene_Battle.prototype.create;
Scene_Battle.prototype.create =function(){
    Scene_Battle_create.call(this);
    BattlerToSpriteTable.reset(this._spriteset);
};
Sprite_Battler.prototype.effekseerTargetOffset =function(){
    return this.effekseerOffset();
};

Sprite_Actor.prototype.effekseerOffset =function(){
    return new Vector2();
};
Sprite_Enemy.prototype.effekseerOffset =function(){
    return getEnemyOffset(this._battlerName);
};

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

Game_Battler.prototype.startEffekseerAnimation =function(param){
    this._effekseer.push(param);
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
        const efk = EffekseerManager.createEffekseer(e);
        this.startEffekseer(efk);
    }
};

Window_BattleLog.prototype.showEffekseerAnimation=function(action,targets){
    const item = action.item();

    if(item.meta.effekseer){
        targets.forEach(function(battler) {
            const param = new EffekseerCreateParamater(
                item.meta.effekseer,
                action
            );
            const userSprite = BattlerToSprite(action.subject());
            param.setUserPosition(userSprite);
            param.setUserOffset(userSprite.effekseerOffset());

            const targetSprite = BattlerToSprite(battler);
            param.setTargetPosition(targetSprite);
            param.setTargetOffset(targetSprite.effekseerTargetOffset());

            battler.startEffekseerAnimation(param);
        });
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


const EffekseerMV ={
    root_directory:root_directory,
    addEnemy:function(name,obj){
        offset_list[name] =obj;
    },
    mergeEnemyOffset:function(object){
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                if(offset_list[key]){
                    console.log('警告:keyの重複('+key+')');
                }
                offset_list[key] = object[key];                
            }
        }
    },

    FactoryItem:EffekseerFactoryItem,
    /**
     * @type {EffekseerManagerClass}
     */
    Manager:EffekseerManager,
};
global.EffekseerMV = EffekseerMV;

})(this);

Window_BattleLog.prototype.startAction = function(subject, action, targets) {
    var item = action.item();
    this.push('performActionStart', subject, action);
    this.push('waitForMovement');
    this.push('performAction', subject, action);
    this.push('showEffekseerAnimation',action,targets);
    this.push('showAnimation', subject, targets.clone(), item.animationId);
    this.displayAction(subject, item);
};

