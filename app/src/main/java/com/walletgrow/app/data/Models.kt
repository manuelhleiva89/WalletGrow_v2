package com.walletgrow.app.data

import java.util.UUID

enum class TransactionType {
    INCOME, EXPENSE
}

data class Transaction(
    val id: String = UUID.randomUUID().toString(),
    val type: TransactionType,
    val category: String,
    val amount: Double,
    val description: String,
    val date: String
)

data class Goal(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val category: String,
    val targetDate: String
)

data class CryptoAsset(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val symbol: String,
    val amount: Double,
    val buyPrice: Double,
    val currentPrice: Double
)

data class FixedTermInvestment(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val principal: Double,
    val rate: Double,
    val termDays: Int,
    val startDate: String
)

data class FinancialState(
    val cashBalance: Double = 12500.0,
    val savingsBalance: Double = 34000.0,
    val creditCardDebt: Double = 4200.0,
    val transactions: List<Transaction> = listOf(
        Transaction(type = TransactionType.INCOME, category = "Salario", amount = 3500.0, description = "Salario mensual principal", date = "2026-08-01"),
        Transaction(type = TransactionType.EXPENSE, category = "Alquiler", amount = 1100.0, description = "Alquiler departamento", date = "2026-08-02"),
        Transaction(type = TransactionType.EXPENSE, category = "Alimentos", amount = 250.0, description = "Supermercado semanal", date = "2026-08-03"),
        Transaction(type = TransactionType.INCOME, category = "Inversión", amount = 180.0, description = "Dividendos acciones", date = "2026-08-04"),
        Transaction(type = TransactionType.EXPENSE, category = "Servicios", amount = 120.0, description = "Luz, Internet, Gas", date = "2026-08-05"),
        Transaction(type = TransactionType.EXPENSE, category = "Transporte", amount = 80.0, description = "Combustible y peajes", date = "2026-08-06")
    ),
    val goals: List<Goal> = listOf(
        Goal(name = "Fondo de Emergencia", targetAmount = 10000.0, currentAmount = 6000.0, category = "Seguridad", targetDate = "2026-12-31"),
        Goal(name = "Viaje a Japón", targetAmount = 5000.0, currentAmount = 1500.0, category = "Viaje", targetDate = "2027-06-30"),
        Goal(name = "Enganche de Auto", targetAmount = 15000.0, currentAmount = 5000.0, category = "Auto", targetDate = "2027-03-15")
    ),
    val cryptoAssets: List<CryptoAsset> = listOf(
        CryptoAsset(name = "Bitcoin", symbol = "BTC", amount = 0.12, buyPrice = 58000.0, currentPrice = 61250.0),
        CryptoAsset(name = "Ethereum", symbol = "ETH", amount = 1.45, buyPrice = 2900.0, currentPrice = 3150.0)
    ),
    val fixedTermInvestments: List<FixedTermInvestment> = listOf(
        FixedTermInvestment(name = "Plazo Fijo Banco Central", principal = 10000.0, rate = 6.5, termDays = 90, startDate = "2026-07-01")
    )
)
