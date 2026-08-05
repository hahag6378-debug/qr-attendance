<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ប្រព័ន្ធស្កេនវត្តមានបុគ្គលិក</title>
    <script src="https://unpkg.com/html5-qrcode"></script>
    <style>
        body { font-family: 'Kantumruy Pro', sans-serif; text-align: center; padding: 20px; background-color: #f4f6f9; }
        .card { max-width: 400px; margin: auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        input[type="text"] { width: 90%; padding: 10px; margin: 10px 0; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; }
        .radio-group { margin: 15px 0; font-size: 16px; text-align: left; padding-left: 20px; }
        #reader { width: 100%; margin-top: 15px; border-radius: 8px; overflow: hidden; }
        #status { margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 6px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>

<div class="card">
    <h2>ស្កេនវត្តមានធ្វើការ</h2>
    
    <label for="userName"><b>ឈ្មោះ ឬ ID បុគ្គលិក៖</b></label>
    <input type="text" id="userName" placeholder="ឧទាហរណ៍៖ ស្រីរ៉ា ឬ លីកា">

    <div class="radio-group">
        <label><input type="radio" name="actionType" value="Check-In" checked> ចូលធ្វើការ (Check-In)</label><br>
        <label><input type="radio" name="actionType" value="Check-Out"> ចេញទៅផ្ទះ (Check-Out)</label>
    </div>

    <div id="reader"></div>
    <div id="status"></div>
</div>

<script>
    const html5QrCode = new Html5Qrcode("reader");

    function showStatus(msg, isSuccess) {
        const statusDiv = document.getElementById('status');
        statusDiv.innerText = msg;
        statusDiv.className = isSuccess ? 'success' : 'error';
    }

    function sendCheckin(userName, lat, lng, actionType, qrData) {
        showStatus("កំពុងផ្ទៀងផ្ទាត់ទិន្នន័យ...", true);
        
        fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: userName,
                userLat: lat,
                userLng: lng,
                actionType: actionType,
                qrCodeData: qrData
            })
        })
        .then(res => res.json())
        .then(data => {
            showStatus(data.message, data.success);
        })
        .catch(err => {
            showStatus("មានបញ្ហាតភ្ជាប់ទៅកាន់ Server!", false);
        });
    }

    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
            const userName = document.getElementById('userName').value;
            const actionType = document.querySelector('input[name="actionType"]:checked').value;

            if (!userName || userName.trim() === "") {
                showStatus("សូមវាយឈ្មោះ ឬ ID របស់អ្នកមុននឹងស្កេន!", false);
                return;
            }

            navigator.geolocation.getCurrentPosition((pos) => {
                sendCheckin(userName, pos.coords.latitude, pos.coords.longitude, actionType, decodedText);
            }, (err) => {
                showStatus("សូមបើក GPS/Location លើទូរស័ព្ទរបស់អ្នក!", false);
            });
        },
        () => {}
    );
</script>

</body>
</html>
