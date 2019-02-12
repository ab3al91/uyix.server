const express = require('express')
const expressws = require('express-ws');
const ModbusRTU = require("modbus-serial");
const Gpio = require('orange-pi-gpio');
const app = express()
let ws = expressws(app);
const port = 80

app.use(express.static('public'));

app.ws('/', function(ws, req) {
  console.log('!!!!!!!!socket connected');
});

var wss = ws.getWss('/');

var brodcast = (slave)=>{
  wss.clients.forEach(function (client) {
    // console.log('Brodcast',msg);
    if(slave){
        var json = {};
        json[slave] = data[slave];
        client.send(JSON.stringify(json));
    }
    else
        client.send(JSON.stringify(data));
  });
}



var data = {"1":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}

/*
data[1][0] -  empty
data[1][1] -  Bathroom lamp RELAY
data[1][2] -  Bathroom lamp STATUS
data[1][3] -  Bedroom lamp RELAY
data[1][4] -  Bedroom lamp STATUS
data[1][5] -  Kitchen lamp RELAY
data[1][6] -  Kitchen lamp STATUS
data[1][7] -  Turn off all RELAY
data[1][8] -  Bell ON/OFF RELAY
data[1][9] -  PIR STATUS
data[1][10] - Power meter STATUS
data[1][11] - Hot water meter STATUS
data[1][12] - Cold water meter STATUS
data[1][13] - Leak STATUS
data[1][14] - Valve ON/OFF RELAY
data[1][15] - M-HUB light-ONE RELAY
data[1][16] - M-HUB light-TWO RELAY
data[1][17] - M-HUB temp STATUS
data[1][18] - Reed STATUS
data[1][19] - Hall lamp STATUS
*/

var meta = {
  "homeid":"stand",
  "others":{
  	"turn-off":[1,7],
    "bell":[1,8]
  },
  "meters":{
  	"Свет":[1,10],
  	"Гор-Вода":[1,11],
    "Хол-Вода":[1,12]
  },
  "rooms":{
      "BATHROOM":{
        "name":"Сан-узел",
        "light":[1,1,1,2],
        "leak":[1,13],
        "valve":[1,14]
      },
      "BEDROOM":{
        "name":"Спальня",
        "light":[1,3,1,4]
      },
      "KITCHEN":{
        "name":"Кухня",
        "light":[1,5,1,6]
      },
      "HALLWAY":{
        "name":"Прихожая",
        "pir":[1,9],
        "reed":[1,18],
        "light":[1,0,1,19]  //  only status
      },
      "HALL":{
        "name":"Зал",
        "light":[1,15,1,15],
        // "temp":[1,17]
      },
      "HAL2":{
        "name":"Зал2",
        "light":[1,16,1,16],
      },
      "MASTER":{
        "name":"Вне дома",
        "light":[1,7,1,7],
      }
  },
  "slaves":{
    "1":{
      "name":"ПЛК",
      "regs":["CHANGE",
      		  "RELAY.BATH.LIGHT","STATUS.BATH.LIGHT",
      		  "RELAY.BED.LIGHT","STATUS.BED.LIGHT",
      		  "RELAY.KITCHEN.LIGHT","STATUS.KITCHEN.LIGHT",
      		  "RELAY.TURN.OFF.ALL","RELAY.BELL",
      		  "STATUS.PIR","STATUS.POWER.METER",
      		  "STATUS.HOT.METER","STATUS.COLD.METER",
      		  "STATUS.LEAK","RELAY.VALVE",
      		  "M-HUB.RELAY.SWITCH1","M-HUB.RELAY.SWITCH2",
      		  "M-HUB.STATUS.TEMP","STATUS.REED",
              "STATUS.HALL.LIGHT"]
  	}
  }
};

var slaveG
var regG
var valueG
let valveCommand
let valveValue
let m_HUB_sw1_Command
let m_HUB_sw2_Command
let m_HUB_sw1_Value
let m_HUB_sw2_Value


app.disable('etag');

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Pass to next layer of middleware
    next();
});


app.get('/write/:slave/:reg/:value', (req, res, next) => {
    slaveG = Number(req.params.slave)
    regG = Number(req.params.reg)
    if(req.params.value == 'true' || req.params.value == 'false')
    	valueG = req.params.value=='true'?1:0
    else
    	valueG = Number(req.params.value)
    if(regG == 14){
    	valveCommand = 1
    	valveValue = valueG
    }
    else if(regG == 15){
    	m_HUB_sw1_Command = 1
    	m_HUB_sw1_Value = valueG
    }
    else if(regG == 16){
    	m_HUB_sw2_Command = 1
    	m_HUB_sw2_Value = valueG
    }
    else{
    	data[slaveG][regG] = valueG
    }
    console.log("write",slaveG, regG, valueG)

    
    
    next();
    // res.send('ok');
})

app.get('/read/:slave/:reg', (req, res, next) => {
    slaveG = Number(req.params.slave);
    regG = Number(req.params.reg);

    //console.log('read',slaveG,regG)
    res.send(String(data[slaveG][regG]));
    
    // next();
})

app.get('/meta.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(meta));
})

app.get('*', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data));
})


//------------------------------------------------------GPIO starts--------------------------------------------------------------//
var bed_manual;
var bath_manual;
var kitchen_manual;

let hall_OUT = new Gpio({pin:13, mode: 'out'});
let bath_OUT = new Gpio({pin:14, mode: 'out'});
let bed_OUT = new Gpio({pin:12, mode: 'out'});
let bell_OUT = new Gpio({pin:1, mode: 'out'});
let contactor_OUT = new Gpio({pin:4, mode: 'out'});
let kitchen_OUT = new Gpio({pin:5, mode: 'out'});

let bed_UP = new Gpio({pin:8, mode: 'up'});
let bath_UP = new Gpio({pin:9, mode: 'up'});
let hall_UP = new Gpio({pin:7, mode: 'up'});
let pir_UP = new Gpio({pin:3, mode: 'up'});
let reed_UP = new Gpio({pin:11, mode: 'up'});
let kitchen_UP = new Gpio({pin:10, mode: 'up'});

let bed_IN = new Gpio({pin:8, mode: 'in'});
let bath_IN = new Gpio({pin:9, mode: 'in'});
let hall_IN = new Gpio({pin:7, mode: 'in'});
let pir_IN = new Gpio({pin:3, mode: 'in'});
let reed_IN = new Gpio({pin:11, mode: 'in'});
let kitchen_IN = new Gpio({pin:10, mode: 'in'});

bed_IN.read()
    .then((state)=>{
        //console.log(state); //state of pin 5
        if(state == 1){
            bed_manual = 1
        }
        else{
            bed_manual = 0;
        }
    });
bath_IN.read()
    .then((state)=>{
        //console.log(state); //state of pin 5
        if(state == 1){
            bath_manual = 1
        }
        else{
            bath_manual = 0;
        }
    });
kitchen_IN.read()
    .then((state)=>{
        //console.log(state); //state of pin 5
        if(state == 1){
            kitchen_manual = 1
        }
        else{
            kitchen_manual = 0;
        }
    });

//------------------------------------------------------GPIO ends--------------------------------------------------------------//


//------------------------------------------------------MODBUS meters starts-----------------------------------------------------//
// create an empty modbus client
const client_S1 = new ModbusRTU();
// open connection to a serial port
//client.connectRTU("/dev/ttyUSB0", { baudRate: 19200 }, ()=> {
client_S1.connectRTUBuffered("/dev/ttyS1", { baudRate: 19200 }, ()=> {

	// start get value
	log('modbus_S1 connected ' + client_S1.isOpen);
	getSlavesValue_S1(slavesIdList_S1);

    gpioFunction()
});
// set timeout, if slave did not reply back
client_S1.setTimeout(1000);

// list of meter's id
const slaveRegLength_S1 = [3];
const slavesIdList_S1 = [1];

const getSlavesValue_S1 = async (slaves) => {
    try{
        // get value of all meters
        for(let slave of slaves) {

            // await sleep(50);

            // output value to console
            var reg = await getSlaveValue_S1(slave);
            // await sleep(50);
            log('Meters: '+reg);
            data[1][10] = Number(reg[0])
            data[1][11] = Number(reg[1])
            data[1][12] = Number(reg[2])

            await sleep(150);
	   }
    } catch(e){
        // if error, handle them here (it should not)
        console.log(e)
    } finally {
    	//clear();
        // after get all data from salve repeate it again
        setImmediate(() => {
            getSlavesValue_S1(slavesIdList_S1);
        })
    }
}

const getSlaveValue_S1 = async (id) => {
    try {
        // set ID of slave
        await client_S1.setID(id);
        // read the 1 registers starting at address 0 (first register)
        let reg = await client_S1.readHoldingRegisters(0, slaveRegLength_S1[id-1]);
            reg = reg.data;

        //brodcast(id);
        return reg;
    } catch(e){
        // if error return -1
        console.log(e)
        return -1
    }
}
//---------------------------------------------------MODBUS meters ends-------------------------------------------------//


//------------------------------------------------------MODBUS leak,valve starts-----------------------------------------------------//
// create an empty modbus client
const client_S2 = new ModbusRTU();
// open connection to a serial port
//client.connectRTU("/dev/ttyUSB0", { baudRate: 19200 }, ()=> {
client_S2.connectRTUBuffered("/dev/ttyS2", { baudRate: 19200 }, ()=> {

    // start get value
    log('modbus_S2 connected ' + client_S2.isOpen);
    getSlavesValue_S2(slavesIdList_S2);
});
// set timeout, if slave did not reply back
client_S2.setTimeout(1000);

// list of meter's id
const slaveRegLength_S2 = [2]
const slavesIdList_S2 = [1]

const getSlavesValue_S2 = async (slaves) => {
    try{
        // get value of all meters
        for(let slave of slaves) {

            if(valveCommand == 1){
                //await sleep(50);
                await setSlaveValue_S2(1, 1, valveValue)
            }

            //await sleep(50);

            // output value to console
            var reg = await getSlaveValue_S2(slave);
            // await sleep(50);
            log('Valve: '+reg)
            data[1][13] = Number(reg[0])
            data[1][14] = Number(reg[1])
            await sleep(150);
       }
    } catch(e){
        // if error, handle them here (it should not)
        console.log(e)
    } finally {
        //clear();
        // after get all data from salve repeate it again
        setImmediate(() => {
            getSlavesValue_S2(slavesIdList_S2);
        })
    }
}

const getSlaveValue_S2 = async (id) => {
    try {
        // set ID of slave
        await client_S2.setID(id);
        // read the 1 registers starting at address 0 (first register)
        let reg = await client_S2.readHoldingRegisters(0, slaveRegLength_S2[id-1]);
        reg = reg.data;

        //brodcast(id);
        return reg;
    } catch(e){
        // if error return -1
        console.log(e)
        return -1
    }
}

const setSlaveValue_S2 = async (id, register, value) => {
    try {
        // set ID of slave
        await client_S2.setID(id);
        await client_S2.writeRegister(register, value);
        await sleep(50);
    } catch(e){
        console.log(e)
    }
    valveCommand = 0
}
//---------------------------------------------------MODBUS leak, valve ends-------------------------------------------------//

//------------------------------------------------------MODBUS M-Hub starts-----------------------------------------------------//

// create an empty modbus client
const client_USB = new ModbusRTU();
// open connection to a serial port
client_USB.connectRTUBuffered("/dev/ttyUSB0", { baudRate: 9600 }, ()=> {

    // start get value
    log('modbus_USB connected ' + client_USB.isOpen);
    getSlavesValue_USB(slavesIdList_USB);
});
// set timeout, if slave did not reply back
client_USB.setTimeout(1000);

// list of meter's id
const slaveRegLength_USB = [3];
const slavesIdList_USB = [1];

const getSlavesValue_USB = async (slaves) => {
    try{
        // get value of all meters
        for(let slave of slaves) {

            if(m_HUB_sw1_Command == 1){
                //await sleep(50);
                await setSlaveValue_USB(1, 0, m_HUB_sw1_Value)
                m_HUB_sw1_Command = 0
            }
            if(m_HUB_sw2_Command == 1){
                //await sleep(50);
                await setSlaveValue_USB(1, 1, m_HUB_sw2_Value)
                m_HUB_sw2_Command = 0
            }

            // await sleep(50);

            // output value to console
            var reg = await getSlaveValue_USB(slave);
            // await sleep(50);
            log('M-Hub: '+reg);
            data[1][15] = Number(reg[0])
            data[1][16] = Number(reg[1])
            data[1][17] = Number(reg[2])

            await sleep(150);
       }
    } catch(e){
        // if error, handle them here (it should not)
        console.log(e)
    } finally {
        //clear();
        // after get all data from salve repeate it again
        setImmediate(() => {
            getSlavesValue_USB(slavesIdList_USB);
        })
    }
}

const getSlaveValue_USB = async (id) => {
    try {
        // set ID of slave
        await client_USB.setID(id);
        // read the 1 registers starting at address 0 (first register)
        let reg = await client_USB.readHoldingRegisters(0, slaveRegLength_USB[id-1]);
            reg = reg.data

        //brodcast(id);
        return reg;
    } catch(e){
        // if error return -1
        console.log(e)
        return -1
    }
}

const setSlaveValue_USB = async (id, register, value) => {
    try {
        // set ID of slave
        await client_USB.setID(id);
        await client_USB.writeRegister(register, value);
        await sleep(50);
    } catch(e){
        console.log(e)
    }
}
//---------------------------------------------------MODBUS M-Hub ends-------------------------------------------------//


//---------------------------------------------------GPIO FUNCTION starts-------------------------------------------------//
var tms = [];
const gpioFunction = () =>{
    try{
        pir_IN.read()
            .then((state)=>{
                //console.log(state); //state of PIR sensor
                if(state == 1 ){
                	clearTimeout(tms[0]);

                	tms[0] = setTimeout(()=>{
                		hall_OUT.write(0)
	                    data[1][19] = 0
                	},5000)

                    hall_OUT.write(1)
                    data[1][9] = 1
                    data[1][19] = 1
                }
                else{
                    // hall_OUT.write(0)
                    // data[1][9] = 0
                    data[1][9] = 0
                }
            })
        reed_IN.read()
            .then((state)=>{
                //console.log(state); //state of REED sensor
                if(state == 1 ){
                    data[1][18] = 1
                }
                else{
                    data[1][18] = 0
                }
            })

        kitchen_IN.read()
            .then((state)=>{
                if(state != kitchen_manual){
                    //console.log(state); //state of KITCHEN switch
                    if(data[1][5] == 1){
                        data[1][5] = 0
                    }
                    else{
                        data[1][5] = 1
                    }
                    kitchen_manual = state
                }
            })
        bed_IN.read()
            .then((state)=>{
                //console.log(state); //state of BEDROOM switch
                if(state != bed_manual ){
                    if(data[1][3] == 1){
                        data[1][3] = 0
                    }
                    else{
                        data[1][3] = 1
                    }
                    bed_manual = state
                }
            })
        bath_IN.read()
            .then((state)=>{
                //console.log(state); //state of BATHROOM switch
                if(state != bath_manual ){
                    if(data[1][1] == 1){
                        data[1][1] = 0
                    }
                    else{
                        data[1][1] = 1
                    }
                    bath_manual = state
                }
            })

        if(data[1][1] == 1){
            bath_OUT.write(1)
            data[1][2] = 1
        }
        else{
            bath_OUT.write(0)
            data[1][2] = 0
        }
        if(data[1][3] == 1){
            bed_OUT.write(1)
            data[1][4] = 1
        }
        else{
            bed_OUT.write(0)
            data[1][4] = 0
        }
        if(data[1][5] == 1){
            kitchen_OUT.write(1)
            data[1][6] = 1
        }
        else{
            kitchen_OUT.write(0)
            data[1][6] = 0
        }
        if(data[1][7] == 1){
            contactor_OUT.write(1)
            data[1][1] = 0
            data[1][3] = 0
            data[1][5] = 0
            data[1][15] = 0
            data[1][16] = 0
            m_HUB_sw1_Command = 1
    		m_HUB_sw1_Value = 0
    		m_HUB_sw2_Command = 1
    		m_HUB_sw2_Value = 0

        }
        else{
            contactor_OUT.write(0)
        }
        if(data[1][8] == 1){
            bell_OUT.write(1)

        }
        else{
            bell_OUT.write(0)
        }


        //console.log(data[1])
        brodcast(1)
    }catch(e){
        console.log(e)
    } finally{
        setImmediate(() => {
            gpioFunction()
        })
    }
}

gpioFunction()
//---------------------------------------------------GPIO FUNCTION ends-------------------------------------------------//

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const log = (txt) => process.stdout.write('\n'+txt);

const clear = (txt) => {
    process.stdout.moveCursor(0, -6);
    process.stdout.cursorTo(0);
    process.stdout.clearScreenDown();
}

const tim = ()=>{
    return (new Date().getTime() - start) + 'ms';
}

app.listen(port, () => console.log(`
           __         __ ___       __      __
/  \\\\_/|  (_ |\\/| /\\ |__) |   |__|/  \\|\\/||_
\\__/ | |  __)|  |/--\\| \\  |   |  |\\__/|  ||__

`));
