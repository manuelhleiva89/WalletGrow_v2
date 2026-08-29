package com.walletgrow.app.data

import android.content.Context
import com.google.gson.Gson

class LocalDatabase(context: Context) {
    private val sharedPrefs = context.getSharedPreferences("walletgrow_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun saveFinancialState(state: FinancialState) {
        val json = gson.toJson(state)
        sharedPrefs.edit().putString("financial_state", json).apply()
    }

    fun loadFinancialState(): FinancialState {
        val json = sharedPrefs.getString("financial_state", null)
        return if (json != null) {
            try {
                gson.fromJson(json, FinancialState::class.java)
            } catch (e: Exception) {
                FinancialState()
            }
        } else {
            val defaultState = FinancialState()
            saveFinancialState(defaultState)
            defaultState
        }
    }
}
