<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>

<h1>🗑️DustbinNotifier📳</h1>

<p><strong>SmartDustbin</strong> is an IoT-based waste management system designed to simplify the process of waste collection by notifying the user when the dustbin is nearly full. The dustbin uses an ultrasonic sensor to detect the level of waste and, upon reaching a certain threshold, sends an SMS notification to the dustbin owner. This reduces manual checking and enhances the efficiency of waste disposal.</p>

<h3>Key Features</h3>
<ul>
    <li><strong>Automatic Detection</strong>: Uses an ultrasonic sensor to detect waste level.</li>
    <li><strong>SMS Notification</strong>: Sends a notification to the owner when the dustbin is full.</li>
    <li><strong>Efficient Waste Management</strong>: Helps in timely disposal and efficient waste collection.</li>
</ul>

<h2>Materials Used</h2>
<table>
    <thead>
        <tr>
            <th>Component</th>
            <th>Quantity</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Arduino UNO</td>
            <td>1</td>
        </tr>
        <tr>
            <td>Ultrasonic Sensor</td>
            <td>1</td>
        </tr>
        <tr>
            <td>SIM900A GSM Module</td>
            <td>1</td>
        </tr>
        <tr>
            <td>Jumper Wires</td>
            <td>As needed</td>
        </tr>
        <tr>
            <td>Breadboard</td>
            <td>1</td>
        </tr>
        <tr>
            <td>Power Supply</td>
            <td>1</td>
        </tr>
    </tbody>
</table>

<h2>Connections Table</h2>
<p>Here’s a table detailing the connections between components:</p>

<table>
    <thead>
        <tr>
            <th>Arduino UNO Pin</th>
            <th>Ultrasonic Sensor</th>
            <th>SIM900A Module</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>5V</td>
            <td>VCC</td>
            <td>-</td>
        </tr>
        <tr>
            <td>GND</td>
            <td>GND</td>
            <td>-</td>
        </tr>
        <tr>
            <td>D9</td>
            <td>TRIG</td>
            <td>-</td>
        </tr>
        <tr>
            <td>D8</td>
            <td>VCC</td>
            <td>-</td>
        </tr>
        <tr>
            <td>GND</td>
            <td>-</td>
            <td>GND</td>
        </tr>
        <tr>
            <td>D10</td>
            <td>-</td>
            <td>TX</td>
        </tr>
        <tr>
            <td>D11</td>
            <td>-</td>
            <td>RX</td>
        </tr>
    </tbody>
</table>

<h2>How It Works</h2>
<ol>
    <li>The ultrasonic sensor measures the distance to the top of the waste in the bin.</li>
    <li>When the waste level reaches a predefined threshold, the Arduino triggers the GSM module.</li>
    <li>The GSM module sends an SMS notification to the designated phone number.</li>
    <li>The user receives a message indicating that the dustbin is nearly full and needs to be emptied.</li>
</ol>

</body>
</html>
