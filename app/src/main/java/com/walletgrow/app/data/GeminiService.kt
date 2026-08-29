package com.walletgrow.app.data

import com.google.gson.Gson
import com.walletgrow.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class GeminiService {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    private val gson = Gson()

    // Gemini Request Classes
    private data class GeminiRequest(val contents: List<Content>)
    private data class Content(val parts: List<Part>)
    private data class Part(val text: String)

    // Gemini Response Classes
    private data class GeminiResponse(val candidates: List<Candidate>?)
    private data class Candidate(val content: ContentResponse?)
    private data class ContentResponse(val parts: List<PartResponse>?)
    private data class PartResponse(val text: String?)

    suspend fun generateFinancialReport(state: FinancialState): String = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "your_api_key_here") {
            return@withContext "⚠️ Error: No se ha configurado la clave API de Gemini en el proyecto (.env). Por favor, define GEMINI_API_KEY para recibir diagnósticos de salud financiera con inteligencia artificial real."
        }

        val totalIncome = state.transactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
        val totalExpenses = state.transactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
        val cryptoValue = state.cryptoAssets.sumOf { it.amount * it.currentPrice }
        val fixedTermValue = state.fixedTermInvestments.sumOf { it.principal }
        val totalInvestments = cryptoValue + fixedTermValue
        val netWorth = state.cashBalance + state.savingsBalance + totalInvestments - state.creditCardDebt

        val prompt = """
            Eres el asesor financiero inteligente de la aplicación WalletGrow.
            Analiza el siguiente perfil financiero personal del usuario y redacta un reporte de salud financiera estructurado, profesional y motivador en español. Utiliza un tono directo, moderno y amigable.
            
            DATOS FINANCIEROS DEL USUARIO:
            - Saldo en Efectivo: $${state.cashBalance} USD
            - Saldo en Cuenta de Ahorro: $${state.savingsBalance} USD
            - Deuda Actual de Tarjetas de Crédito: $${state.creditCardDebt} USD
            - Patrimonio Neto Total (Activos - Pasivos): $${netWorth} USD
            
            - Ingresos Totales de este mes: $${totalIncome} USD
            - Gastos Totales de este mes: $${totalExpenses} USD
            
            METAS DE AHORRO:
            ${state.goals.joinToString("\n") { "  * ${it.name}: Meta $${it.targetAmount} USD, Ahorrado: $${it.currentAmount} USD, Fecha Límite: ${it.targetDate}" }}
            
            PORTAFOLIO DE INVERSIONES:
            - Criptomonedas: $${cryptoValue} USD (${state.cryptoAssets.joinToString(", ") { "${it.name} (${it.symbol}): ${it.amount} unidades, Precio actual: $${it.currentPrice} USD" }})
            - Plazos Fijos: $${fixedTermValue} USD (${state.fixedTermInvestments.joinToString(", ") { "${it.name}: Monto $${it.principal} USD, Tasa ${it.rate}%, Plazo ${it.termDays} días" }})
            
            REGLAS DEL REPORTE:
            1. Comienza con una puntuación general de salud financiera del 1 al 100 y una breve explicación de la calificación.
            2. Divide tu diagnóstico en tres secciones claras usando Markdown con títulos atractivos:
               - 📈 Fortalezas Financieras (Destaca el nivel de ahorro, inversiones, o control de gastos).
               - ⚠️ Áreas de Oportunidad (Analiza la deuda de tarjeta de crédito, o el balance de gastos respecto a ingresos).
               - 🚀 Plan de Acción Inteligente (3 pasos concretos, medibles y realistas basados en sus metas de ahorro y perfil).
            3. No abuses de las mayúsculas o la jerga técnica difícil de comprender. Agrega sugerencias específicas para el portafolio cripto y los plazos fijos.
        """.trimIndent()

        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"
        val requestBodyJson = gson.toJson(GeminiRequest(listOf(Content(listOf(Part(prompt))))))
        val body = requestBodyJson.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .build()

        try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext "⚠️ Error del servidor Gemini: Código ${response.code}. Por favor, verifica el estado de tu clave de API."
                }
                val responseBody = response.body?.string() ?: return@withContext "⚠️ Error: Respuesta vacía de la API de Gemini."
                val geminiResponse = gson.fromJson(responseBody, GeminiResponse::class.java)
                val text = geminiResponse.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                return@withContext text ?: "⚠️ No se recibió texto en la respuesta de la Inteligencia Artificial."
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext "❌ Error de conexión: ${e.message}. Asegúrate de tener una conexión activa a Internet y que la clave de API sea válida."
        }
    }
}
