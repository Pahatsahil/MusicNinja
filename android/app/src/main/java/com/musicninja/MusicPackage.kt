package com.musicninja

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class MusicPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ) = listOf(MusicPlayer(reactContext), FFmpegModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ) = emptyList<ViewManager<*, *>>()
}