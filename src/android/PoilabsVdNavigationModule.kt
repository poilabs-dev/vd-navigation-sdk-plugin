package __PACKAGE_NAME__

import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.poilabs.vd.nav.non.ui.jsonclient.VDResponseListener
import com.poilabs.vd.nav.non.ui.models.PLPStatus
import com.poilabs.vd.nav.non.ui.models.PoiManager
import com.getpoi.android_vd_nav_ui.view.PoiVdNavigationActivity

class PoilabsVdNavigationModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), 
    VDResponseListener {
    
    private val reactContext: ReactApplicationContext = reactContext
    private var uniqueId: String = ""
    private var locationChangeListener: Boolean = false
    
    override fun getName(): String = "PoilabsVdNavigationModule"
    
    @ReactMethod
    fun startPoilabsVdNavigation(
        applicationId: String,
        applicationSecret: String,
        uniqueId: String,
        language: String,
        title: String,
        promise: Promise
    ) {
        try {
            this.uniqueId = uniqueId
            
            PoiManager.init(
                context = currentActivity!!,
                appId = applicationId,
                secret = applicationSecret,
                language = language,
                title = title,
                vdResponseListener = this,
                locationCallback = object : PoiManager.LocationCallback {
                    override fun onLocation(latitude: Double, longitude: Double, floorLevel: Int?) {
                        if (locationChangeListener) {
                            val params = Arguments.createMap().apply {
                                putDouble("latitude", latitude)
                                putDouble("longitude", longitude)
                                floorLevel?.let { putInt("floorLevel", it) }
                            }
                            sendEvent("PoilabsLocationChangeEvent", params)
                        }
                    }
                    
                    override fun onStatusChanged(status: PLPStatus) {
                        val params = Arguments.createMap().apply {
                            putString("status", status.toString())
                        }
                        sendEvent("PoilabsStatusChangeEvent", params)
                    }
                }
            )
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun startPoilabsVdNavigationWithCustomConfig(
        configUrl: String,
        applicationId: String,
        applicationSecret: String,
        uniqueId: String,
        language: String,
        title: String,
        promise: Promise
    ) {
        try {
            this.uniqueId = uniqueId
            
            PoiManager.init(
                context = currentActivity!!,
                configUrl = configUrl,
                appId = applicationId,
                secret = applicationSecret,
                language = language,
                title = title,
                vdResponseListener = this,
                locationCallback = object : PoiManager.LocationCallback {
                    override fun onLocation(latitude: Double, longitude: Double, floorLevel: Int?) {
                        if (locationChangeListener) {
                            val params = Arguments.createMap().apply {
                                putDouble("latitude", latitude)
                                putDouble("longitude", longitude)
                                floorLevel?.let { putInt("floorLevel", it) }
                            }
                            sendEvent("PoilabsLocationChangeEvent", params)
                        }
                    }
                    
                    override fun onStatusChanged(status: PLPStatus) {
                        val params = Arguments.createMap().apply {
                            putString("status", status.toString())
                        }
                        sendEvent("PoilabsStatusChangeEvent", params)
                    }
                }
            )
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun showNavigationActivity(promise: Promise) {
        try {
            PoiManager.setUniqueId(uniqueId)
            
            val intent = Intent(reactContext, PoiVdNavigationActivity::class.java)
            currentActivity?.startActivity(intent)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("NAVIGATION_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun stopPoilabsVdNavigation(promise: Promise) {
        try {
            // SDK'yı durdur
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun updateUniqueId(uniqueId: String, promise: Promise) {
        try {
            this.uniqueId = uniqueId
            PoiManager.setUniqueId(uniqueId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_ID_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun addLocationChangeListener() {
        locationChangeListener = true
    }
    
    @ReactMethod
    fun removeLocationChangeListener() {
        locationChangeListener = false
    }
    
    override fun onSuccess() {
        showNavigationActivity(object : Promise {
            override fun resolve(value: Any?) {}
            override fun reject(code: String?, message: String?) {}
            override fun reject(code: String?, throwable: Throwable?) {}
            override fun reject(code: String?, message: String?, throwable: Throwable?) {}
            override fun reject(throwable: Throwable?) {}
            override fun reject(throwable: Throwable?, userInfo: WritableMap?) {}
            override fun reject(code: String?, userInfo: WritableMap) {}
            override fun reject(code: String?, message: String?, userInfo: WritableMap) {}
            override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) {}
            override fun reject(message: String) {}
        })
    }
    
    override fun onFail(throwable: Throwable?) {
        val params = Arguments.createMap().apply {
            putString("error", throwable?.message ?: "Unknown error")
        }
        sendEvent("PoilabsErrorEvent", params)
    }
    
    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter Calls
    }
    
    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in Event Emitter Calls
    }
}