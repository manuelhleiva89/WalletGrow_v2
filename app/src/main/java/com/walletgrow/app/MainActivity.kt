package com.walletgrow.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.walletgrow.app.data.*
import androidx.activity.enableEdgeToEdge
import com.walletgrow.app.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            WalletGrowTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

enum class Screen {
    DASHBOARD, TRANSACTIONS, GOALS, INVESTMENTS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation() {
    val context = LocalContext.current
    val db = remember { LocalDatabase(context) }
    var financialState by remember { mutableStateOf(db.loadFinancialState()) }
    var currentScreen by remember { mutableStateOf(Screen.DASHBOARD) }

    // Save state whenever it is modified
    fun updateState(newState: FinancialState) {
        financialState = newState
        db.saveFinancialState(newState)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.TrendingUp,
                            contentDescription = "WalletGrow Logo",
                            tint = TealAccent,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "WalletGrow",
                            fontWeight = FontWeight.Bold,
                            color = NavyPrimary,
                            fontSize = 20.sp
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = NavyPrimary
                ),
                actions = {
                    var showAiDialog by remember { mutableStateOf(false) }
                    IconButton(
                        onClick = { showAiDialog = true },
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .background(GoldAccent.copy(alpha = 0.15f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Reporte de Salud Financiera IA",
                            tint = GoldAccent
                        )
                    }

                    if (showAiDialog) {
                        AiAdvisorDialog(
                            state = financialState,
                            onDismiss = { showAiDialog = false }
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = currentScreen == Screen.DASHBOARD,
                    onClick = { currentScreen = Screen.DASHBOARD },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Resumen", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NavyPrimary,
                        selectedTextColor = NavyPrimary,
                        indicatorColor = NavyPrimary.copy(alpha = 0.1f),
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted
                    )
                )
                NavigationBarItem(
                    selected = currentScreen == Screen.TRANSACTIONS,
                    onClick = { currentScreen = Screen.TRANSACTIONS },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Transacciones") },
                    label = { Text("Flujos", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NavyPrimary,
                        selectedTextColor = NavyPrimary,
                        indicatorColor = NavyPrimary.copy(alpha = 0.1f),
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted
                    )
                )
                NavigationBarItem(
                    selected = currentScreen == Screen.GOALS,
                    onClick = { currentScreen = Screen.GOALS },
                    icon = { Icon(Icons.Default.Flag, contentDescription = "Metas") },
                    label = { Text("Metas", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NavyPrimary,
                        selectedTextColor = NavyPrimary,
                        indicatorColor = NavyPrimary.copy(alpha = 0.1f),
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted
                    )
                )
                NavigationBarItem(
                    selected = currentScreen == Screen.INVESTMENTS,
                    onClick = { currentScreen = Screen.INVESTMENTS },
                    icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Inversiones") },
                    label = { Text("Portafolio", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NavyPrimary,
                        selectedTextColor = NavyPrimary,
                        indicatorColor = NavyPrimary.copy(alpha = 0.1f),
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted
                    )
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(LightBackground)
        ) {
            when (currentScreen) {
                Screen.DASHBOARD -> DashboardScreen(financialState, onStateChanged = { updateState(it) })
                Screen.TRANSACTIONS -> TransactionsScreen(financialState, onStateChanged = { updateState(it) })
                Screen.GOALS -> GoalsScreen(financialState, onStateChanged = { updateState(it) })
                Screen.INVESTMENTS -> InvestmentsScreen(financialState, onStateChanged = { updateState(it) })
            }
        }
    }
}

// ==========================================
// SCREEN 1: DASHBOARD
// ==========================================
@Composable
fun DashboardScreen(state: FinancialState, onStateChanged: (FinancialState) -> Unit) {
    val totalIncome = state.transactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpenses = state.transactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
    val cryptoValue = state.cryptoAssets.sumOf { it.amount * it.currentPrice }
    val fixedTermValue = state.fixedTermInvestments.sumOf { it.principal }
    val totalInvestments = cryptoValue + fixedTermValue
    val netWorth = state.cashBalance + state.savingsBalance + totalInvestments - state.creditCardDebt

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quick Summary Cards Panel
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = NavyPrimary),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Patrimonio Neto Total",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$${String.format(Locale.US, "%,.2f", netWorth)} USD",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = Color.White.copy(alpha = 0.15f))
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Efectivo + Ahorros", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                            Text("$${String.format(Locale.US, "%,.1f", state.cashBalance + state.savingsBalance)}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Column {
                            Text("Inversiones", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                            Text("$${String.format(Locale.US, "%,.1f", totalInvestments)}", color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Deuda Tarjeta", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                            Text("$${String.format(Locale.US, "%,.1f", state.creditCardDebt)}", color = Color(0xFFFFB4AB), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }
        }

        // Cashflow interactive Canvas Chart
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderLight, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Flujo de Caja Mensual",
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .padding(horizontal = 8.dp)
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val width = size.width
                            val height = size.height

                            val maxVal = maxOf(totalIncome, totalExpenses, 1.0)
                            val incomeHeight = ((totalIncome / maxVal) * (height - 30.dp.toPx())).toFloat()
                            val expenseHeight = ((totalExpenses / maxVal) * (height - 30.dp.toPx())).toFloat()

                            // Base grids
                            drawLine(
                                color = Color(0xFFE2E8F0),
                                start = Offset(0f, height - 20.dp.toPx()),
                                end = Offset(width, height - 20.dp.toPx()),
                                strokeWidth = 1.dp.toPx()
                            )

                            // Income Bar (Green)
                            val barWidth = 65.dp.toPx()
                            val incomeLeft = (width / 2f) - barWidth - 20.dp.toPx()
                            drawRoundRect(
                                color = GreenIncome,
                                topLeft = Offset(incomeLeft, height - 20.dp.toPx() - incomeHeight),
                                size = Size(barWidth, incomeHeight),
                                cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx())
                            )

                            // Expense Bar (Red)
                            val expenseLeft = (width / 2f) + 20.dp.toPx()
                            drawRoundRect(
                                color = RedExpense,
                                topLeft = Offset(expenseLeft, height - 20.dp.toPx() - expenseHeight),
                                size = Size(barWidth, expenseHeight),
                                cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx())
                            )
                        }

                        // Labels above bars
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 24.dp),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            Text(
                                text = "$${String.format(Locale.US, "%,.0f", totalIncome)}",
                                color = GreenIncome,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.width(40.dp))
                            Text(
                                text = "$${String.format(Locale.US, "%,.0f", totalExpenses)}",
                                color = RedExpense,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Text("Ingresos", color = TextDark, fontWeight = FontWeight.Medium, fontSize = 12.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                        Spacer(modifier = Modifier.width(40.dp))
                        Text("Gastos", color = TextDark, fontWeight = FontWeight.Medium, fontSize = 12.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    }
                }
            }
        }

        // Recent transactions panel
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderLight, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Últimos Movimientos",
                            fontWeight = FontWeight.Bold,
                            color = NavyPrimary,
                            fontSize = 15.sp
                        )
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = "History Icon",
                            tint = TextMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    val recent = state.transactions.takeLast(4).reversed()
                    if (recent.isEmpty()) {
                        Text(
                            text = "No hay transacciones registradas aún.",
                            color = TextMuted,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    } else {
                        recent.forEach { tx ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .background(
                                                if (tx.type == TransactionType.INCOME) GreenIncome.copy(alpha = 0.1f)
                                                else RedExpense.copy(alpha = 0.1f),
                                                CircleShape
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (tx.type == TransactionType.INCOME) Icons.Default.ArrowUpward else Icons.Default.ArrowDownward,
                                            contentDescription = null,
                                            tint = if (tx.type == TransactionType.INCOME) GreenIncome else RedExpense,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(tx.description, fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
                                        Text(tx.category, color = TextMuted, fontSize = 11.sp)
                                    }
                                }
                                Text(
                                    text = "${if (tx.type == TransactionType.INCOME) "+" else "-"}$${String.format(Locale.US, "%,.2f", tx.amount)}",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (tx.type == TransactionType.INCOME) GreenIncome else RedExpense,
                                    fontSize = 13.sp
                                )
                            }
                            HorizontalDivider(color = BorderLight.copy(alpha = 0.6f))
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// SCREEN 2: TRANSACTIONS FLOW
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(state: FinancialState, onStateChanged: (FinancialState) -> Unit) {
    var showAddForm by remember { mutableStateOf(false) }

    var amountStr by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf(TransactionType.EXPENSE) }
    var category by remember { mutableStateOf("Alimentos") }
    var customCategory by remember { mutableStateOf("") }

    val incomeCategories = listOf("Salario", "Inversión", "Transferencia", "Ventas", "Otros")
    val expenseCategories = listOf("Alimentos", "Alquiler", "Transporte", "Servicios", "Salud", "Educación", "Entretenimiento", "Otros")

    fun submitTransaction() {
        val amount = amountStr.toDoubleOrNull() ?: return
        if (description.isBlank()) return
        val finalCategory = if (category == "Otros" && customCategory.isNotBlank()) customCategory else category

        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val currentDate = sdf.format(Date())

        val newTx = Transaction(
            type = selectedType,
            category = finalCategory,
            amount = amount,
            description = description,
            date = currentDate
        )

        // Adjust balance appropriately
        var newCash = state.cashBalance
        var newDebt = state.creditCardDebt
        if (selectedType == TransactionType.INCOME) {
            newCash += amount
        } else {
            if (finalCategory == "Alquiler" || finalCategory == "Servicios") {
                newCash -= amount
            } else {
                newDebt += amount // Card debt by default for variable expenses
            }
        }

        onStateChanged(
            state.copy(
                transactions = state.transactions + newTx,
                cashBalance = newCash,
                creditCardDebt = newDebt
            )
        )

        // Reset fields
        amountStr = ""
        description = ""
        customCategory = ""
        showAddForm = false
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddForm = true },
                containerColor = NavyPrimary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Registrar Movimiento")
            }
        }
    ) { p ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(p)
                .padding(16.dp)
        ) {
            Text(
                text = "Flujos Financieros",
                fontWeight = FontWeight.Bold,
                color = NavyPrimary,
                fontSize = 20.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.transactions.reversed()) { tx ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderLight, RoundedCornerShape(12.dp))
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(12.dp)
                                .fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .background(
                                            if (tx.type == TransactionType.INCOME) GreenIncome.copy(alpha = 0.1f)
                                            else RedExpense.copy(alpha = 0.1f),
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (tx.type == TransactionType.INCOME) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                                        contentDescription = null,
                                        tint = if (tx.type == TransactionType.INCOME) GreenIncome else RedExpense,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(tx.description, fontWeight = FontWeight.Bold, color = TextDark, fontSize = 14.sp)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(tx.category, color = TextMuted, fontSize = 11.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("•", color = TextMuted, fontSize = 11.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(tx.date, color = TextMuted, fontSize = 11.sp)
                                    }
                                }
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "${if (tx.type == TransactionType.INCOME) "+" else "-"}$${String.format(Locale.US, "%,.2f", tx.amount)}",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (tx.type == TransactionType.INCOME) GreenIncome else RedExpense,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(
                                    onClick = {
                                        // Dynamic balance adjustment on delete
                                        var newCash = state.cashBalance
                                        var newDebt = state.creditCardDebt
                                        if (tx.type == TransactionType.INCOME) {
                                            newCash -= tx.amount
                                        } else {
                                            if (tx.category == "Alquiler" || tx.category == "Servicios") {
                                                newCash += tx.amount
                                            } else {
                                                newDebt = maxOf(0.0, newDebt - tx.amount)
                                            }
                                        }
                                        onStateChanged(
                                            state.copy(
                                                transactions = state.transactions.filter { it.id != tx.id },
                                                cashBalance = newCash,
                                                creditCardDebt = newDebt
                                            )
                                        )
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Eliminar", tint = RedExpense.copy(alpha = 0.7f), modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add Transaction Dialog
        if (showAddForm) {
            Dialog(onDismissRequest = { showAddForm = false }) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Nuevo Movimiento", fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 18.sp)

                        // Type selector
                        Row(modifier = Modifier.fillMaxWidth()) {
                            Button(
                                onClick = {
                                    selectedType = TransactionType.EXPENSE
                                    category = "Alimentos"
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (selectedType == TransactionType.EXPENSE) RedExpense else Color.LightGray.copy(alpha = 0.3f),
                                    contentColor = if (selectedType == TransactionType.EXPENSE) Color.White else TextDark
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(end = 4.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Gasto", fontSize = 13.sp)
                            }
                            Button(
                                onClick = {
                                    selectedType = TransactionType.INCOME
                                    category = "Salario"
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (selectedType == TransactionType.INCOME) GreenIncome else Color.LightGray.copy(alpha = 0.3f),
                                    contentColor = if (selectedType == TransactionType.INCOME) Color.White else TextDark
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 4.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Ingreso", fontSize = 13.sp)
                            }
                        }

                        // Amount field
                        OutlinedTextField(
                            value = amountStr,
                            onValueChange = { amountStr = it },
                            label = { Text("Monto (USD)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                focusedLabelColor = NavyPrimary
                            )
                        )

                        // Description field
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Descripción") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                focusedLabelColor = NavyPrimary
                            )
                        )

                        // Category dropdown selection simulations
                        Text("Categoría", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
                        val activeCategories = if (selectedType == TransactionType.INCOME) incomeCategories else expenseCategories

                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            maxItemsInEachRow = 3,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            activeCategories.forEach { cat ->
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(
                                            if (category == cat) NavyPrimary else Color.LightGray.copy(alpha = 0.25f)
                                        )
                                        .clickable { category = cat }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = cat,
                                        color = if (category == cat) Color.White else TextDark,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        if (category == "Otros") {
                            OutlinedTextField(
                                value = customCategory,
                                onValueChange = { customCategory = it },
                                label = { Text("Categoría Personalizada") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = NavyPrimary,
                                    focusedLabelColor = NavyPrimary
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(onClick = { showAddForm = false }) {
                                Text("Cancelar", color = TextMuted)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { submitTransaction() },
                                colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                enabled = amountStr.isNotBlank() && description.isNotBlank()
                            ) {
                                Text("Registrar", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// SCREEN 3: SAVINGS GOALS
// ==========================================
@Composable
fun GoalsScreen(state: FinancialState, onStateChanged: (FinancialState) -> Unit) {
    var showAddForm by remember { mutableStateOf(false) }

    var goalName by remember { mutableStateOf("") }
    var targetStr by remember { mutableStateOf("") }
    var initialSavedStr by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Seguridad") }
    var dateStr by remember { mutableStateOf("2026-12-31") }

    val categories = listOf("Seguridad", "Viaje", "Auto", "Vivienda", "Regalo", "Estudios", "Otros")

    fun submitGoal() {
        val target = targetStr.toDoubleOrNull() ?: return
        val saved = initialSavedStr.toDoubleOrNull() ?: 0.0

        val newGoal = Goal(
            name = goalName,
            targetAmount = target,
            currentAmount = saved,
            category = category,
            targetDate = dateStr
        )

        onStateChanged(state.copy(goals = state.goals + newGoal))

        // Reset
        goalName = ""
        targetStr = ""
        initialSavedStr = ""
        category = "Seguridad"
        showAddForm = false
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddForm = true },
                containerColor = NavyPrimary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Planificar Meta")
            }
        }
    ) { p ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(p)
                .padding(16.dp)
        ) {
            Text(
                text = "Metas de Ahorro",
                fontWeight = FontWeight.Bold,
                color = NavyPrimary,
                fontSize = 20.sp,
                modifier = Modifier.padding(bottom = 4.dp)
            )
            Text(
                text = "Planifica tu futuro y visualiza tu progreso en tiempo real",
                color = TextMuted,
                fontSize = 11.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(state.goals) { goal ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderLight, RoundedCornerShape(12.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .background(TealAccent.copy(alpha = 0.1f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Flag,
                                            contentDescription = null,
                                            tint = TealAccent,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(goal.name, fontWeight = FontWeight.Bold, color = TextDark, fontSize = 15.sp)
                                        Text("Categoría: ${goal.category} • Vence: ${goal.targetDate}", color = TextMuted, fontSize = 10.sp)
                                    }
                                }

                                IconButton(
                                    onClick = {
                                        onStateChanged(state.copy(goals = state.goals.filter { it.id != goal.id }))
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Borrar", tint = RedExpense.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Progress percentage math
                            val progress = (goal.currentAmount / goal.targetAmount).coerceIn(0.0, 1.0).toFloat()
                            val pctStr = String.format(Locale.US, "%.0f%%", progress * 100)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "$${String.format(Locale.US, "%,.0f", goal.currentAmount)} ahorrados",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TealAccent
                                )
                                Text(
                                    text = "Meta: $${String.format(Locale.US, "%,.0f", goal.targetAmount)} USD ($pctStr)",
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            LinearProgressIndicator(
                                progress = progress,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = TealAccent,
                                trackColor = BorderLight
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            // Interactive buttons to quick save inside goal
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Aportar rápido: ", fontSize = 11.sp, color = TextMuted)
                                Spacer(modifier = Modifier.width(4.dp))
                                val contextText = listOf(50.0, 100.0, 500.0)
                                contextText.forEach { sum ->
                                    Box(
                                        modifier = Modifier
                                            .padding(horizontal = 4.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(NavyPrimary.copy(alpha = 0.08f))
                                            .clickable {
                                                val updatedGoals = state.goals.map { g ->
                                                    if (g.id == goal.id) {
                                                        g.copy(currentAmount = minOf(g.targetAmount, g.currentAmount + sum))
                                                    } else g
                                                }
                                                // Deduct from standard Cash balance
                                                onStateChanged(
                                                    state.copy(
                                                        goals = updatedGoals,
                                                        cashBalance = maxOf(0.0, state.cashBalance - sum)
                                                    )
                                                )
                                            }
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text("+$${sum.toInt()}", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NavyPrimary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add Goal Dialog
        if (showAddForm) {
            Dialog(onDismissRequest = { showAddForm = false }) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Planificar Meta de Ahorro", fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 17.sp)

                        OutlinedTextField(
                            value = goalName,
                            onValueChange = { goalName = it },
                            label = { Text("Nombre de la Meta") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                focusedLabelColor = NavyPrimary
                            )
                        )

                        OutlinedTextField(
                            value = targetStr,
                            onValueChange = { targetStr = it },
                            label = { Text("Monto Objetivo (USD)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                focusedLabelColor = NavyPrimary
                            )
                        )

                        OutlinedTextField(
                            value = initialSavedStr,
                            onValueChange = { initialSavedStr = it },
                            label = { Text("Monto Ahorrado Inicial (USD)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                focusedLabelColor = NavyPrimary
                            )
                        )

                        OutlinedTextField(
                            value = dateStr,
                            onValueChange = { dateStr = it },
                            label = { Text("Fecha Límite (AAAA-MM-DD)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                focusedLabelColor = NavyPrimary
                            )
                        )

                        Text("Categoría de Meta", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 12.sp)
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            maxItemsInEachRow = 4,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            categories.forEach { cat ->
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(
                                            if (category == cat) NavyPrimary else Color.LightGray.copy(alpha = 0.25f)
                                        )
                                        .clickable { category = cat }
                                        .padding(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = cat,
                                        color = if (category == cat) Color.White else TextDark,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(onClick = { showAddForm = false }) {
                                Text("Cancelar", color = TextMuted)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { submitGoal() },
                                colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                enabled = goalName.isNotBlank() && targetStr.isNotBlank()
                            ) {
                                Text("Guardar Meta", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// SCREEN 4: INVESTMENTS PORTFOLIO
// ==========================================
@Composable
fun InvestmentsScreen(state: FinancialState, onStateChanged: (FinancialState) -> Unit) {
    var showAddDialog by remember { mutableStateOf(false) }
    var investmentType by remember { mutableStateOf(0) } // 0 = Crypto, 1 = Plazo Fijo

    // Fields for Crypto Asset
    var cryptoName by remember { mutableStateOf("") }
    var cryptoSymbol by remember { mutableStateOf("") }
    var cryptoAmountStr by remember { mutableStateOf("") }
    var cryptoBuyPriceStr by remember { mutableStateOf("") }

    // Fields for Fixed Term
    var pfName by remember { mutableStateOf("") }
    var pfPrincipalStr by remember { mutableStateOf("") }
    var pfRateStr by remember { mutableStateOf("") }
    var pfDaysStr by remember { mutableStateOf("90") }

    fun submitInvestment() {
        if (investmentType == 0) {
            val amount = cryptoAmountStr.toDoubleOrNull() ?: return
            val buyPrice = cryptoBuyPriceStr.toDoubleOrNull() ?: return
            if (cryptoName.isBlank() || cryptoSymbol.isBlank()) return

            val newAsset = CryptoAsset(
                name = cryptoName,
                symbol = cryptoSymbol.uppercase(),
                amount = amount,
                buyPrice = buyPrice,
                currentPrice = buyPrice * 1.05 // Standard dummy appreciation for UI simulation
            )

            // Deduct from Cash to make the buy
            val cost = amount * buyPrice
            onStateChanged(
                state.copy(
                    cryptoAssets = state.cryptoAssets + newAsset,
                    cashBalance = maxOf(0.0, state.cashBalance - cost)
                )
            )

            // Reset
            cryptoName = ""
            cryptoSymbol = ""
            cryptoAmountStr = ""
            cryptoBuyPriceStr = ""
        } else {
            val principal = pfPrincipalStr.toDoubleOrNull() ?: return
            val rate = pfRateStr.toDoubleOrNull() ?: return
            val days = pfDaysStr.toIntOrNull() ?: 90
            if (pfName.isBlank()) return

            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val currentDate = sdf.format(Date())

            val newPF = FixedTermInvestment(
                name = pfName,
                principal = principal,
                rate = rate,
                termDays = days,
                startDate = currentDate
            )

            // Deduct principal from cash balance
            onStateChanged(
                state.copy(
                    fixedTermInvestments = state.fixedTermInvestments + newPF,
                    cashBalance = maxOf(0.0, state.cashBalance - principal)
                )
            )

            // Reset
            pfName = ""
            pfPrincipalStr = ""
            pfRateStr = ""
        }
        showAddDialog = false
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = NavyPrimary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Añadir Inversión")
            }
        }
    ) { p ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(p)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Portafolio de Inversión",
                fontWeight = FontWeight.Bold,
                color = NavyPrimary,
                fontSize = 20.sp
            )

            // Dynamic crypto values math
            val totalCryptoValue = state.cryptoAssets.sumOf { it.amount * it.currentPrice }
            val totalCryptoCost = state.cryptoAssets.sumOf { it.amount * it.buyPrice }
            val cryptoProfit = totalCryptoValue - totalCryptoCost
            val cryptoProfitPct = if (totalCryptoCost > 0) (cryptoProfit / totalCryptoCost) * 100 else 0.0

            // Crypto Assets Section
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderLight, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Criptomonedas", fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 15.sp)
                        Column(horizontalAlignment = Alignment.End) {
                            Text("$${String.format(Locale.US, "%,.2f", totalCryptoValue)} USD", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                            Text(
                                text = "${if (cryptoProfit >= 0) "+" else ""}${String.format(Locale.US, "%.1f", cryptoProfitPct)}% ($${String.format(Locale.US, "%.1f", cryptoProfit)})",
                                color = if (cryptoProfit >= 0) GreenIncome else RedExpense,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    if (state.cryptoAssets.isEmpty()) {
                        Text("No tienes criptomonedas cargadas aún.", color = TextMuted, fontSize = 12.sp)
                    } else {
                        state.cryptoAssets.forEach { asset ->
                            val currentVal = asset.amount * asset.currentPrice
                            val costVal = asset.amount * asset.buyPrice
                            val assetProfit = currentVal - costVal

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .background(GoldAccent.copy(alpha = 0.15f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(asset.symbol.take(2), fontWeight = FontWeight.Bold, color = GoldAccent, fontSize = 12.sp)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(asset.name, fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
                                        Text("${asset.amount} ${asset.symbol} • Compra: $${asset.buyPrice}", color = TextMuted, fontSize = 10.sp)
                                    }
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("$${String.format(Locale.US, "%,.2f", currentVal)}", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
                                        Text(
                                            text = "${if (assetProfit >= 0) "+" else ""}$${String.format(Locale.US, "%.1f", assetProfit)}",
                                            color = if (assetProfit >= 0) GreenIncome else RedExpense,
                                            fontSize = 10.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(6.dp))
                                    IconButton(
                                        onClick = {
                                            onStateChanged(state.copy(cryptoAssets = state.cryptoAssets.filter { it.id != asset.id }))
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Borrar", tint = RedExpense.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                            HorizontalDivider(color = BorderLight.copy(alpha = 0.5f))
                        }
                    }
                }
            }

            // Fixed Term / Plazos Fijos Section
            val totalPFPrincipal = state.fixedTermInvestments.sumOf { it.principal }

            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderLight, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Plazos Fijos bancarios", fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 15.sp)
                        Text("$${String.format(Locale.US, "%,.2f", totalPFPrincipal)} USD", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    if (state.fixedTermInvestments.isEmpty()) {
                        Text("No tienes plazos fijos cargados.", color = TextMuted, fontSize = 12.sp)
                    } else {
                        state.fixedTermInvestments.forEach { pf ->
                            // Interest earned math: Principal * (Rate/100) * (Term/365)
                            val earned = pf.principal * (pf.rate / 100.0) * (pf.termDays / 365.0)

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .background(TealAccent.copy(alpha = 0.12f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.AccountBalance, contentDescription = null, tint = TealAccent, modifier = Modifier.size(16.dp))
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(pf.name, fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
                                        Text("Plazo: ${pf.termDays} días • Tasa: ${pf.rate}% • Inicio: ${pf.startDate}", color = TextMuted, fontSize = 10.sp)
                                    }
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("$${String.format(Locale.US, "%,.2f", pf.principal)}", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
                                        Text("Ganancia: +$${String.format(Locale.US, "%.1f", earned)}", color = GreenIncome, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.width(6.dp))
                                    IconButton(
                                        onClick = {
                                            onStateChanged(state.copy(fixedTermInvestments = state.fixedTermInvestments.filter { it.id != pf.id }))
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Borrar", tint = RedExpense.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                            HorizontalDivider(color = BorderLight.copy(alpha = 0.5f))
                        }
                    }
                }
            }
        }

        // Add Investment Overlay Dialog
        if (showAddDialog) {
            Dialog(onDismissRequest = { showAddDialog = false }) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Añadir Nueva Inversión", fontWeight = FontWeight.Bold, color = NavyPrimary, fontSize = 17.sp)

                        TabRow(selectedTabIndex = investmentType, containerColor = Color.White) {
                            Tab(selected = investmentType == 0, onClick = { investmentType = 0 }) {
                                Text("Criptomonedas", modifier = Modifier.padding(10.dp), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = if (investmentType == 0) NavyPrimary else TextMuted)
                            }
                            Tab(selected = investmentType == 1, onClick = { investmentType = 1 }) {
                                Text("Plazo Fijo", modifier = Modifier.padding(10.dp), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = if (investmentType == 1) NavyPrimary else TextMuted)
                            }
                        }

                        if (investmentType == 0) {
                            OutlinedTextField(
                                value = cryptoName,
                                onValueChange = { cryptoName = it },
                                label = { Text("Nombre del Criptoactivo (ej: Bitcoin)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                            OutlinedTextField(
                                value = cryptoSymbol,
                                onValueChange = { cryptoSymbol = it },
                                label = { Text("Símbolo (ej: BTC)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                            OutlinedTextField(
                                value = cryptoAmountStr,
                                onValueChange = { cryptoAmountStr = it },
                                label = { Text("Cantidad comprada") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                            OutlinedTextField(
                                value = cryptoBuyPriceStr,
                                onValueChange = { cryptoBuyPriceStr = it },
                                label = { Text("Precio de compra (USD por unidad)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                        } else {
                            OutlinedTextField(
                                value = pfName,
                                onValueChange = { pfName = it },
                                label = { Text("Banco / Institución emisora") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                            OutlinedTextField(
                                value = pfPrincipalStr,
                                onValueChange = { pfPrincipalStr = it },
                                label = { Text("Monto Principal (USD)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                            OutlinedTextField(
                                value = pfRateStr,
                                onValueChange = { pfRateStr = it },
                                label = { Text("Tasa Nominal Anual %") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                            OutlinedTextField(
                                value = pfDaysStr,
                                onValueChange = { pfDaysStr = it },
                                label = { Text("Plazo de vencimiento (Días)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = NavyPrimary, focusedLabelColor = NavyPrimary)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(onClick = { showAddDialog = false }) {
                                Text("Cancelar", color = TextMuted)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { submitInvestment() },
                                colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                enabled = if (investmentType == 0) cryptoName.isNotBlank() && cryptoAmountStr.isNotBlank() else pfName.isNotBlank() && pfPrincipalStr.isNotBlank()
                            ) {
                                Text("Guardar Inversión", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// GEMINI PERSONAL FINANCIAL ADVISOR DIALOG
// ==========================================
@Composable
fun AiAdvisorDialog(state: FinancialState, onDismiss: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var aiResponse by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var loadingTip by remember { mutableStateOf("Conectando con el asesor de inteligencia artificial de WalletGrow...") }

    // Dynamic advice tip strings to rotate during network request
    val tips = listOf(
        "Analizando tus patrones de ingresos mensuales...",
        "Evaluando tus deudas de tarjeta de crédito...",
        "Comparando tus ahorros actuales con las metas planeadas...",
        "Calculando el rendimiento de tus activos en cripto...",
        "Estructurando recomendaciones estratégicas a tu medida..."
    )

    LaunchedEffect(Unit) {
        // Coroutine to rotate loading tips every 2.5 seconds
        val tipJob = coroutineScope.launch {
            var idx = 0
            while (isLoading) {
                loadingTip = tips[idx % tips.size]
                idx++
                delay(2500)
            }
        }

        try {
            val service = GeminiService()
            aiResponse = service.generateFinancialReport(state)
        } catch (e: Exception) {
            aiResponse = "❌ Error inesperado al comunicarse con Gemini: ${e.message}"
        } finally {
            isLoading = false
            tipJob.cancel()
        }
    }

    Dialog(
        onDismissRequest = { if (!isLoading) onDismiss() },
        properties = DialogProperties(dismissOnBackPress = !isLoading, dismissOnClickOutside = !isLoading)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .padding(8.dp)
                .border(2.dp, GoldAccent.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "IA",
                            tint = GoldAccent,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Asesor Inteligente IA",
                            fontWeight = FontWeight.Bold,
                            color = NavyPrimary,
                            fontSize = 17.sp
                        )
                    }
                    if (!isLoading) {
                        IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = TextMuted)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = BorderLight)
                Spacer(modifier = Modifier.height(16.dp))

                if (isLoading) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            color = GoldAccent,
                            strokeWidth = 4.dp,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = loadingTip,
                            textAlign = TextAlign.Center,
                            fontSize = 12.sp,
                            color = TextDark,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 24.dp)
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = aiResponse,
                            fontSize = 13.sp,
                            color = TextDark,
                            lineHeight = 20.sp,
                            fontWeight = FontWeight.Normal
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("¡Entendido, gracias!", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
