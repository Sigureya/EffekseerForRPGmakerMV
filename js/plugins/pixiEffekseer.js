(function(){
'use strict'
const  Core = effekseer.getCore();
class EffekseerRenderer extends PIXI.Sprite
{
  constructor()
  {
    super();
    this._gl = null;
  }

  _init()
  {
    effekseer.init(this._gl);
  	effekseer.setProjectionOrthographic(this._windowWidth, this._windowHeight, 0.1, 100.0);
  	effekseer.setCameraLookAt(
       0.0, 0.0, 10.0,
       0.0, 0.0, 0.0,
       0.0, 1.0, 0.0
       );
  }

  _update()
  {
    effekseer.update();
  }

  _render()
  {
    effekseer.draw();
  }

  _renderWebGL(renderer)
  {
    if(this._gl == null)
    {
      this._gl = renderer.gl;
      this._windowWidth = renderer.view.width;
      this._windowHeight = renderer.view.height;
      this._init();
    }

    // Container of pixi does not have update function.
    this._update();
    this._render();

    super._renderWebGL(renderer);
  }
  setCameraMatrix(){
    const e = effekseer;
  }
}


class EffekseerEmitter extends PIXI.Sprite
{
  constructor(path)
  {
    super();
      this._gl = null;
      this._path = path;
      this._renderer = null;
      this._effect = null;
      this.handle = null;
      this.isLoaded = false;
  }

  _init()
  {
    this._effect = effekseer.loadEffect(this._path, function(){ this.isLoaded=true; }.bind(this));
  }

  _update()
  {
    if(this.handle == null && this.isLoaded)
    {
      this.handle = effekseer.play(this._effect);
      this.handle.setScale( 20.0, 20.0, 20.0 );
    }
  }


  _renderWebGL(renderer)
  {
    if(this._gl == null)
    {
      this._gl = renderer.gl;
      this._init();
    }

    // Container of pixi does not have update function.
    this._update();
    super._renderWebGL(renderer);
  }
	/**
	* Set the rotation of this effect instance.
	* @param {number} x X value of euler angle
	* @param {number} y Y value of euler angle
	* @param {number} z Z value of euler angle
	 */
	setRotation(x, y, z) {
    this.handle.setRotation(x,y,z);
	}
  /**
	* Set the position of this effect instance.
	* @param {number} x X value of location
	* @param {number} y Y value of location
	* @param {number} z Z value of location
	*/
  setPosition(x,y,z){
    this.handle.setLocation(x,y,z);      
  }
  setLocation(x,y,z){
    this.handle.setLocation(x,y,z);
  }
  /**
   * Set the scale of this effect instance.
   * @param {number} x X value of scale factor
   * @param {number} y Y value of scale factor
   * @param {number} z Z value of scale factor
   */
  setScale(x,y,z){
    this.handle.setScale(x,y,z);
  }
  /**
	* Set the target location of this effect instance.
	* @param {number} x X value of target location
	* @param {number} y Y value of target location
	* @param {number} z Z value of target location
	*/
	setTargetPosition(x, y, z) {
    this.handle.setTargetLocation(x,y,z);
//		Core.SetTargetLocation(this.native, x, y, z);
	}
  /**
   * if returned false, this effect is end of playing.
   * @property {boolean}
   */
  exists() {
    return !!Core.Exists(this.handle);
  }
  /**
   * Stop this effect instance.
   */
  stop(){
    this.handle.stop();
  }
  isInitialized(){
    return this.isLoaded && this.handle !==null;
  }
  isPlaying(){
    return  !this.isInitialized()||  this.exists();
  }


}



if (PIXI)
{
  PIXI.EffekseerRenderer = EffekseerRenderer;
  PIXI.EffekseerEmitter = EffekseerEmitter;
}
else
{
  console.error('Error: Cannot find global variable `PIXI`, Effekseer plguin will not be installed.');
}

})();