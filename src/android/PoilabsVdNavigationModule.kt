package __PACKAGE_NAME__

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.getpoi.android_vd_nav_ui.view.PoiVdNavigationActivity
import com.poilabs.vd.nav.non.ui.jsonclient.VDResponseListener
import com.poilabs.vd.nav.non.ui.models.LocationCallback
import com.poilabs.vd.nav.non.ui.models.PoiManager
import com.poilabs.poilabspositioning.model.PLPStatus

class PoilabsVdNavigationModule internal constructor(context: ReactApplicationContext?) :
    ReactContextBaseJavaModule(context) {
    
    companion object {
        private var lastLatitude: Double = 0.0
        private var lastLongitude: Double = 0.0
        private var lastFloorLevel: Int? = null
        private var lastFloorName: String? = null
        private var hasRealLocation: Boolean = false
        
        private const val TAG = "PoilabsVdNavigation"
    }
    
    override fun getName(): String {
        return "PoilabsVdNavigationModule"
    }
    
    @ReactMethod
    fun initialize(
        applicationId: String,
        secretKey: String,
        uniqueId: String,
        language: String,
        title: String,
        configUrl: String?,
        promise: Promise
    ) {
        try {
            hasRealLocation = false
            
            currentActivity?.let { activity ->
                
                val locationCallback = object : LocationCallback {
                    override fun onLocation(
                        latitude: Double,
                        longitude: Double,
                        floorLevel: Int?,
                        floorName: String?
                    ) { 
                        lastLatitude = latitude
                        lastLongitude = longitude
                        lastFloorLevel = floorLevel
                        lastFloorName = floorName
                        hasRealLocation = true
                    }
                }
                
                if (configUrl != null && configUrl.isNotEmpty()) {
                    PoiManager.init(
                        context = activity,
                        appId = applicationId,
                        secret = secretKey,
                        optionalUrl = configUrl,
                        language = language,
                        title = title,
                        vdResponseListener = object : VDResponseListener {
                            override fun onSuccess() {
                                PoiManager.setUniqueId(uniqueId)
                                promise.resolve(true)
                            }
                            
                            override fun onFail(throwable: Throwable?) {
                                throwable?.printStackTrace()
                                promise.reject("INIT_FAILED", throwable?.message, throwable)
                            }
                        },
                        locationCallback = locationCallback
                    )
                } else {
                    PoiManager.init(
                        context = activity,
                        appId = applicationId,
                        secret = secretKey,
                        language = language,
                        title = title,
                        vdResponseListener = object : VDResponseListener {
                            override fun onSuccess() {
                                PoiManager.setUniqueId(uniqueId)
                                promise.resolve(true)
                            }
                            
                            override fun onFail(throwable: Throwable?) {
                                throwable?.printStackTrace()
                                promise.reject("INIT_FAILED", throwable?.message, throwable)
                            }
                        },
                        locationCallback = locationCallback
                    )
                }
            } ?: run {
                promise.reject("ACTIVITY_NULL", "Activity is null")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject("INIT_EXCEPTION", e.message, e)
        }
    }
    
    @ReactMethod
    fun showPoilabsVdNavigation(promise: Promise) {
        try {
            currentActivity?.let { activity ->
                Intent(activity, PoiVdNavigationActivity::class.java).also {
                    activity.startActivity(it)
                    promise.resolve(true)
                }
            } ?: run {
                promise.reject("ACTIVITY_NULL", "Activity is null")
            }
        } catch (e: Exception) {
            promise.reject("NAVIGATION_EXCEPTION", e.message, e)
        }
    }
    
    @ReactMethod
    fun getUserLocation(promise: Promise) {
        if (hasRealLocation) {
            val map = Arguments.createMap().apply {
                putDouble("latitude", lastLatitude)
                putDouble("longitude", lastLongitude)
                lastFloorLevel?.let { putInt("floorLevel", it) } ?: putNull("floorLevel")
            }
            
            promise.resolve(map)
        } else {
            val map = Arguments.createMap().apply {
                putDouble("latitude", 0.0)
                putDouble("longitude", 0.0)
                putNull("floorLevel")
            }

            promise.resolve(map)
        }
    }
    
    @ReactMethod
    fun updateUniqueId(uniqueId: String, promise: Promise) {
        try {
            PoiManager.setUniqueId(uniqueId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_UNIQUEID_EXCEPTION", e.message, e)
        }
    }
}