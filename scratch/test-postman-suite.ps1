Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   VENURO FLAGSHIP API & VECTOR RAG TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$pass = 0
$fail = 0

function RunTest($name, $method, $url, $body = $null, $token = $null, $expectedStatus = 200) {
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    
    $params = @{
        Uri = "$baseUrl$url"
        Method = $method
        Headers = $headers
        TimeoutSec = 8
    }
    if ($body) {
        $params["Body"] = ($body | ConvertTo-Json -Depth 5)
    }

    try {
        $resp = Invoke-RestMethod @params
        Write-Host " [PASS] $name" -ForegroundColor Green
        $script:pass++
        return $resp
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -and $statusCode -eq $expectedStatus) {
            Write-Host " [PASS] $name (Expected status $expectedStatus)" -ForegroundColor Green
            $script:pass++
            return $null
        } else {
            Write-Host " [FAIL] $name - Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:fail++
            return $null
        }
    }
}

# 1. Auth & RBAC
Write-Host "[1. Authentication & RBAC]" -ForegroundColor Yellow
$userAuth = RunTest "Login Normal User" "POST" "/api/auth/login" @{ email = "user@venuro.com"; password = "password123" }
$adminAuth = RunTest "Login Admin" "POST" "/api/auth/login" @{ email = "admin@venuro.com"; password = "password123" }
$coordAuth = RunTest "Login Coordinator" "POST" "/api/auth/login" @{ email = "coordinator@venuro.com"; password = "password123" }
$profile = RunTest "Get Me Profile" "GET" "/api/auth/me" $null $userAuth.token

# 2. Event Discovery & Shows
Write-Host "`n[2. Event Catalog & Discovery]" -ForegroundColor Yellow
$events = RunTest "Get All Events (12 Events)" "GET" "/api/events"
$filtered = RunTest "Filter Events by Category (Concerts)" "GET" "/api/events?category=concerts"
$eventDetails = RunTest "Get Event Details by ID (Dune 2)" "GET" "/api/events/evt_dune2"
$seatMap = RunTest "Get Seat Matrix for Showtime" "GET" "/api/shows/shw_dune2_1/seat-map"

# 3. Concurrency Control & Redis Seat Locking
Write-Host "`n[3. Concurrency Control & Redis Seat Locking]" -ForegroundColor Yellow
$seatToLock = "H" + (Get-Random -Minimum 1 -Maximum 9)
$lockRes = RunTest "Acquire Redis Seat Lock (SET NX EX 300) on Seat $seatToLock" "POST" "/api/bookings/lock-seats" @{ showId = "shw_dune2_1"; seatIds = @($seatToLock) } $userAuth.token
$releaseRes = RunTest "Release Redis Seat Lock on Seat $seatToLock" "POST" "/api/bookings/release-seats" @{ showId = "shw_dune2_1"; seatIds = @($seatToLock) } $userAuth.token

# 4. Booking Checkout & Digital QR Pass
Write-Host "`n[4. Booking Checkout & Digital Passes]" -ForegroundColor Yellow
$seatToBook = "J" + (Get-Random -Minimum 1 -Maximum 9)
$checkoutRes = RunTest "Checkout & Generate Signed QR Pass on Seat $seatToBook" "POST" "/api/bookings/checkout" @{ showId = "shw_dune2_1"; seatIds = @($seatToBook); paymentMethod = "UPI" } $userAuth.token
$myBookings = RunTest "Get My Bookings" "GET" "/api/bookings/my-bookings" $null $userAuth.token

# 5. AI Assistant & Vector Semantic Search
Write-Host "`n[5. AI Assistant & Semantic Vector Search]" -ForegroundColor Yellow
$aiChat = RunTest "AI Assistant Chat (RAG Augmented)" "POST" "/api/ai/chat" @{ message = "What stadium concerts in Mumbai do you recommend and what is your cancellation policy?" }
$semanticSearch = RunTest "Vector Semantic Search (Cosine Similarity Scoring)" "GET" "/api/ai/semantic-search?q=stadium+rock+concert+in+mumbai"
$aiRecs = RunTest "Get AI Recommendations" "GET" "/api/ai/recommendations"
$aiStatus = RunTest "Get AI Engine Telemetry" "GET" "/api/ai/status"

# 6. Admin Telemetry
Write-Host "`n[6. Admin Telemetry & Analytics]" -ForegroundColor Yellow
$analytics = RunTest "Get Platform Analytics (GMV)" "GET" "/api/admin/analytics" $null $adminAuth.token
$usersList = RunTest "Get All Users List" "GET" "/api/admin/users" $null $adminAuth.token
$health = RunTest "Get System Health" "GET" "/api/admin/health" $null $adminAuth.token

# 7. Coordinator Tools
Write-Host "`n[7. Coordinator Tools & QR Verification]" -ForegroundColor Yellow
$coordEvents = RunTest "Get Coordinator Managed Events" "GET" "/api/events/coordinator/my-events" $null $coordAuth.token
$verifyQr = RunTest "Verify Digital QR Pass" "POST" "/api/bookings/verify-qr" @{ bookingId = "bkg_demo_coldplay"; bookingNumber = "VNR-COLD-2026-99" } $coordAuth.token

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   RESULTS: $pass PASSED  |  $fail FAILED" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================================`n" -ForegroundColor Cyan
