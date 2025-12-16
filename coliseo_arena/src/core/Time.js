/**
 * Time.js - Singleton para gestionar el timing del juego
 * Inspirado en Time de Unity y Engine.get_process_delta_time() de Godot
 */

class TimeManager {
    constructor() {
        if (TimeManager.instance) {
            return TimeManager.instance;
        }
        
        // Delta time
        this._delta = 0;                    // Tiempo desde el último frame (en segundos)
        this._fixedDelta = 1 / 60;          // Delta fijo para física (60 FPS)
        this._unscaledDelta = 0;            // Delta sin escalar por timeScale
        
        // Time scale
        this._timeScale = 1.0;              // Multiplicador de velocidad del juego (1 = normal, 0.5 = slow motion, 2 = fast)
        
        // Frame counting
        this._frameCount = 0;               // Frames totales desde el inicio
        this._physicsFrameCount = 0;        // Fixed updates totales
        
        // Time tracking (en segundos)
        this._elapsedTime = 0;              // Tiempo total desde inicio (escalado)
        this._unscaledElapsedTime = 0;      // Tiempo total sin escalar
        this._lastFrameTime = 0;            // Timestamp del último frame
        
        // Performance tracking
        this._fps = 60;
        this._frameTimes = [];              // Array circular para promediar FPS
        this._maxFrameTimeSamples = 30;
        
        TimeManager.instance = this;
    }
    
    /**
     * Actualiza el time manager con el nuevo frame time
     * @param {number} currentTime - Timestamp actual en milisegundos
     */
    update(currentTime) {
        // Calcular delta en segundos
        if (this._lastFrameTime === 0) {
            this._lastFrameTime = currentTime;
            this._unscaledDelta = this._fixedDelta;
        } else {
            this._unscaledDelta = Math.min((currentTime - this._lastFrameTime) / 1000, 0.25); // Cap a 250ms
        }
        
        this._lastFrameTime = currentTime;
        this._delta = this._unscaledDelta * this._timeScale;
        
        // Actualizar elapsed time
        this._elapsedTime += this._delta;
        this._unscaledElapsedTime += this._unscaledDelta;
        
        // Frame count
        this._frameCount++;
        
        // FPS tracking
        this._frameTimes.push(this._unscaledDelta);
        if (this._frameTimes.length > this._maxFrameTimeSamples) {
            this._frameTimes.shift();
        }
        
        // Calcular FPS promedio
        const avgDelta = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
        this._fps = avgDelta > 0 ? 1 / avgDelta : 60;
    }
    
    /**
     * Notifica que se ejecutó un fixed update
     */
    notifyFixedUpdate() {
        this._physicsFrameCount++;
    }
    
    /**
     * Reinicia el time manager (útil para restart del juego)
     */
    reset() {
        this._delta = 0;
        this._unscaledDelta = 0;
        this._frameCount = 0;
        this._physicsFrameCount = 0;
        this._elapsedTime = 0;
        this._unscaledElapsedTime = 0;
        this._lastFrameTime = 0;
        this._frameTimes = [];
    }
    
    // Getters (solo lectura para el exterior)
    
    /** Delta time del último frame (escalado) en segundos */
    get delta() { return this._delta; }
    
    /** Delta time del último frame sin escalar en segundos */
    get unscaledDelta() { return this._unscaledDelta; }
    
    /** Delta fijo para física (1/60) */
    get fixedDelta() { return this._fixedDelta; }
    
    /** Velocidad del juego (1 = normal) */
    get timeScale() { return this._timeScale; }
    set timeScale(value) { 
        this._timeScale = Math.max(0, value); // No permitir valores negativos
    }
    
    /** Frames totales */
    get frameCount() { return this._frameCount; }
    
    /** Physics updates totales */
    get physicsFrameCount() { return this._physicsFrameCount; }
    
    /** Tiempo total escalado en segundos */
    get elapsedTime() { return this._elapsedTime; }
    
    /** Tiempo total sin escalar en segundos */
    get unscaledElapsedTime() { return this._unscaledElapsedTime; }
    
    /** FPS promedio */
    get fps() { return this._fps; }
}

// Crear instancia singleton
const Time = new TimeManager();

// No congelar el objeto porque necesita modificar sus propiedades internas
// El patrón singleton ya previene crear múltiples instancias

export default Time;