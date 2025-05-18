package __PACKAGE_NAME__

import android.content.Intent
import com.facebook.react.bridge.*
import com.getpoi.android_vd_nav_ui.view.PoiVdNavigationActivity
import com.poilabs.vd.nav.non.ui.jsonclient.VDResponseListener
import com.poilabs.vd.nav.non.ui.manager.PLPStatus
import com.poilabs.vd.nav.non.ui.models.LocationCallback
import com.poilabs.vd.nav.non.ui.models.PoiManager

class PoilabsVdNavigationModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var mApplicationId: String = ""
    private var mApplicationSecretKey: String = ""
    private var mUniqueId: String = ""
    private var mLanguage: String = "en"
    private var mTitle: String = ""
    private var mConfigUrl: String? = null
    private var mHasLocation: Boolean = false
    private var mLastLatitude: Double = 0.0
    private var mLastLongitude: Double = 0.0
    private var mLastFloorLevel: Int? = null
    private var mLocationPromise: Promise? = null
    
    override fun getName(): String {
        return "PoilabsVdNavigationModule"
    }
    
    @ReactMethod
    fun initialize(applicationId: String, secretKey: String, uniqueId: String, 
                   language: String, title: String, configUrl: String?, 
                   promise: Promise) {
        try {
            mApplicationId = applicationId
            mApplicationSecretKey = secretKey
            mUniqueId = uniqueId
            mLanguage = language
            mTitle = title
            mConfigUrl = configUrl
            
            val activity = currentActivity ?: run {
                promise.reject("ACTIVITY_NULL", "Activity is null")
                return
            }
            
            if (mConfigUrl != null && mConfigUrl!!.isNotEmpty()) {
                PoiManager.init(
                    activity,
                    mApplicationId,
                    mApplicationSecretKey,
                    mConfigUrl,
                    mLanguage,
                    mTitle,
                    object : VDResponseListener {
                        override fun onSuccess() {
                            PoiManager.setUniqueId(mUniqueId)
                            promise.resolve(true)
                        }
                        
                        override fun onFail(throwable: Throwable?) {
                            promise.reject("INIT_FAILED", throwable?.message, throwable)
                        }
                    },
                    createLocationCallback()
                )
            } else {
                PoiManager.init(
                    activity,
                    mApplicationId,
                    mApplicationSecretKey,
                    mLanguage,
                    mTitle,
                    object : VDResponseListener {
                        override fun onSuccess() {
                            PoiManager.setUniqueId(mUniqueId)
                            promise.resolve(true)
                        }
                        
                        override fun onFail(throwable: Throwable?) {
                            promise.reject("INIT_FAILED", throwable?.message, throwable)
                        }
                    },
                    createLocationCallback()
                )
            }
        } catch (e: Exception) {
            promise.reject("INIT_EXCEPTION", e.message, e)
        }
    }
    
    @ReactMethod
    fun showPoilabsVdNavigation(promise: Promise) {
        try {
            val activity = currentActivity ?: run {
                promise.reject("ACTIVITY_NULL", "Activity is null")
                return
            }
            
            if (mApplicationId.isEmpty() || mApplicationSecretKey.isEmpty()) {
                promise.reject("NOT_INITIALIZED", "SDK has not been initialized")
                return
            }
            
            // Initialize if not already initialized
            if (mConfigUrl != null && mConfigUrl!!.isNotEmpty()) {
                PoiManager.init(
                    activity,
                    mApplicationId,
                    mApplicationSecretKey,
                    mConfigUrl,
                    mLanguage,
                    mTitle,
                    object : VDResponseListener {
                        override fun onSuccess() {
                            PoiManager.setUniqueId(mUniqueId)
                            val intent = Intent(reactApplicationContext, PoiVdNavigationActivity::class.java)
                            activity.startActivity(intent)
                            promise.resolve(true)
                        }
                        
                        override fun onFail(throwable: Throwable?) {
                            promise.reject("NAVIGATION_FAILED", throwable?.message, throwable)
                        }
                    },
                    createLocationCallback()
                )
            } else {
                PoiManager.init(
                    activity,
                    mApplicationId,
                    mApplicationSecretKey,
                    mLanguage,
                    mTitle,
                    object : VDResponseListener {
                        override fun onSuccess() {
                            PoiManager.setUniqueId(mUniqueId)
                            val intent = Intent(reactApplicationContext, PoiVdNavigationActivity::class.java)
                            activity.startActivity(intent)
                            promise.resolve(true)
                        }
                        
                        override fun onFail(throwable: Throwable?) {
                            promise.reject("NAVIGATION_FAILED", throwable?.message, throwable)
                        }
                    },
                    createLocationCallback()
                )
            }
        } catch (e: Exception) {
            promise.reject("NAVIGATION_EXCEPTION", e.message, e)
        }
    }
    
    @ReactMethod
    fun getUserLocation(promise: Promise) {
        if (mHasLocation) {
            val location = Arguments.createMap().apply {
                putDouble("latitude", mLastLatitude)
                putDouble("longitude", mLastLongitude)
                mLastFloorLevel?.let { putInt("floorLevel", it) } ?: putNull("floorLevel")
            }
            promise.resolve(location)
        } else {
            mLocationPromise = promise
        }
    }
    
    private fun createLocationCallback(): LocationCallback {
        return object : LocationCallback {
            override fun onLocation(latitude: Double, longitude: Double, floorLevel: Int?) {
                mLastLatitude = latitude
                mLastLongitude = longitude
                mLastFloorLevel = floorLevel
                mHasLocation = true
                
                mLocationPromise?.let { promise ->
                    val location = Arguments.createMap().apply {
                        putDouble("latitude", latitude)
                        putDouble("longitude", longitude)
                        floorLevel?.let { putInt("floorLevel", it) } ?: putNull("floorLevel")
                    }
                    promise.resolve(location)
                    mLocationPromise = null
                }
            }
            
            override fun onStatusChanged(status: PLPStatus) {
                // Optional status handling
            }
        }
    }
}