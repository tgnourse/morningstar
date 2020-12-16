var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Influx = require('influx');

// mbid.js
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var MBID = 0x01;
var MBP = 502;

// utilities.js
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var MBADDR_OFFSET = 4096;
var EEAddrStart = 1280 + MBADDR_OFFSET;
var SizeOfEEAddresses = 512;
var EEAddrEnd = EEAddrStart + SizeOfEEAddresses;
var AppConfigAddrBlockStart = EEAddrStart + 1;
var SizeOfAppConfigSettings = 52;
var AppConfigAddrBlockEnd = AppConfigAddrBlockStart + (SizeOfAppConfigSettings / 2);
var NetworkSettingAddrBlockStart = AppConfigAddrBlockEnd;
var SizeOfNetworkSettings = 8 + 20;
var NetworkSettingAddrBlockEnd = NetworkSettingAddrBlockStart + (SizeOfNetworkSettings / 2);
var SNMPTrapSettingsAddrBlockStart = NetworkSettingAddrBlockEnd;
var SizeOfSNMPTrapSettings = 4 + 20;
var SNMPTrapSettingsAddrBlockEnd = (SNMPTrapSettingsAddrBlockStart + (SizeOfSNMPTrapSettings / 2));
var NotifySettingsAddrBlockStart = SNMPTrapSettingsAddrBlockEnd;
var SizeOfNotifySettingsBytes = 30;
var NUM_NOTIFICATION_ITEMS = 4;
var NotifySettingsAddrBlockEnd = (NotifySettingsAddrBlockStart + ((SizeOfNotifySettingsBytes / 2) * NUM_NOTIFICATION_ITEMS));
var SMTPAddrBlockEnd = EEAddrEnd;
var SizeOfSMTPSettings = 160 / 2;
var SMTPAddrBlockStart = SMTPAddrBlockEnd - SizeOfSMTPSettings;
var MBADDR_PICVERSION = 0 + MBADDR_OFFSET;
var EmailStatusFlagAddr = 4 + MBADDR_OFFSET;
var CurAppConfigStart = 15 + MBADDR_OFFSET;
var NetBIOSAddrBlockStart = 41 + MBADDR_OFFSET;
var V_SCALE_LDEC = 0;
var V_SCALE_RDEC = 1;
var I_SCALE_LDEC = 2;
var I_SCALE_RDEC = 3;
var DIPSWAddr = 48;
var MBWR_DIPSW_BIT = 128;
var MBIDAddr = 57369;
var MtrIDAddr = 57370;
var MBSWVERAddr = 4;
var MBHWVERAddr = 57549;
var MBSNUMAddr = 57536;
var MBPROCBVerAddr = 4096;
var FaultsArray = ["Overcurrent", "FETs shorted", "Software fault", "Battery high voltage disconnect", "Array high voltage disconnect", "DIP switch changed", "EEprom edited while running", "RTS shorted", "RTS disconnected", "EEprom Error", "Software reset", "Slave control timeout"];
var AlarmsArray = ["RTS open", "RTS shorted", "RTS disconnected", "Heatsink temp. sensor open", "Heatsink temp. sensor shorted", "Heatsink overtemp limiting", "Current limiting", "Current error when fets are off", "Battery sense error", "Battery sense disconnected", "Uncalibrated", "RTS miswired", "High voltage disconnect", "High duty cycle diversion mode", "Miswire", "FETS open", "P12 alarm", "High array voltage current limit", "Maximum adc value reached", "Control was reset"];
function ShowMenu() {
    document.getElementById("menuid").innerHTML = '<div class="idTopBorder"></div><div id="idTopBar"><div class="content"><div class="right"><h3><i>TRISTAR MPPT</i></h3></div><a href="http://www.morningstarcorp.com/"><img src="MSLogo.gif" ALT="logo" class="image"><h1>MORNINGSTAR<br><h2>&nbsp c &nbsp o &nbsp r &nbsp p &nbsp o &nbsp r &nbsp a &nbsp t &nbsp i &nbsp o &nbsp n</h2></a></div></div></h1></div><div class="PrimNav"><ul><li><a href="liveview.html" class="first">Live View</a></li><li><a href="network.html" class="">Network</a></li><li><a href="datalog.html" class="">Data Log</a></li></ul></div>';
    document.getElementById("footid").innerHTML = '<div class="FootBar"></div><div id="idFooter"><div id="idFooterContent"><table><tr><td>TriStar-60 MPPT</td><td>' + GetCtrlVerStr() + "</td></tr><tr><td>" + GetSNStr() + "</div></td><td>" + GetServerVerStr() + '</td></tr></table><br><a href="http://www.morningstarcorp.com/">&copy; Copyright 2010 Morningstar Corporation</a><br></div></div>'
}
function GetServerVerStr() {
    var A = MBJSReadModbusInts(MBP, MBID, MBPROCBVerAddr.toString(), "1");
    return "Server v" + A + ".25"
}
function trim(A) {
    return A.replace(/^\s\s*/, "").replace(/\s\s*$/, "")
}
function WREnabled() {
    var A = MBJSReadModbusInts(MBP, MBID, DIPSWAddr.toString(), "1");
    if (A & MBWR_DIPSW_BIT) {
        return 1
    } else {
        return 0
    }
}
function EnableTextBoxes(B, A) {
    for (i = 0; i < document.forms[B].elements.length; i++) {
        if ((document.forms[B].elements[i].type == "text") || (document.forms[B].elements[i].type == "checkbox")) {
            document.forms[B].elements[i].disabled = !A
        }
    }
}
function ByteValidate(B) {
    var A = parseInt(B.value, 10);
    if ((A < 0) || (A > 255)) {
        document.getElementById("errdiv").innerHTML = "Range must be from 0 to 254"
    } else {
        document.getElementById("errdiv").innerHTML = ""
    }
}
function saveNetworkAddr(C, D, F) {
    var E = 0;
    while (E < 4) {
        var B = D + E;
        E++;
        var A = D + E;
        E++;
        MBJSWriteModbusBytes(MBP, MBID, F.toString(), parseInt(document.forms[C].elements[B].value, 10), parseInt(document.forms[C].elements[A].value, 10));
        F++
    }
}
function loadNetworkAddr(E, D, G, H) {
    var C = MBJSReadModbusBytes(MBP, MBID, H.toString(), "2");
    C = C.split("#");
    var F = 0;
    var A = "";
    while (F < 4) {
        if (D) {
            var B = G + F;
            document.forms[E].elements[B].value = parseInt(C[F]).toString()
        } else {
            A += parseInt(C[F]).toString();
            if (F < 3) {
                A += "."
            }
        }
        F++
    }
    if (!(D)) {
        document.getElementById(G).innerHTML = A
    }
}
function GetCtrlVerStr() {
    var A = MBJSReadModbusBytes(MBP, MBID, MBHWVERAddr.toString(), "2");
    A = A.split("#");
    return "Controller v" + parseInt(A[0]).toString(16) + "." + parseInt(A[1]).toString(16) + "." + parseInt(MBJSReadModbusInts(MBP, MBID, MBSWVERAddr.toString(), "1")).toString(16)
}
function GetSNStr() {
    return "Serial #" + MBJSReadStringFromModbus(MBP, MBID, MBSNUMAddr.toString(), 4)
}
function ScaleFactors() {
    this.VScale;
    this.IScale;
    GetScale = function(B, D) {
        var C = MBJSReadModbusInts(MBP, MBID, B.toString(), "1");
        var A = MBJSReadModbusInts(MBP, MBID, D.toString(), "1");
        return C + (A / (65535))
    }
    ;
    this.Init = function() {
        this.VScale = GetScale(V_SCALE_LDEC, V_SCALE_RDEC);
        this.IScale = GetScale(I_SCALE_LDEC, I_SCALE_RDEC)
    }
}
function MBJSReadModbusInts(C, J, E, B) {
    var F = MBJSReadCSV(C, J, E, B);
    var D = F.split(",");
    var A = D[2];
    var I = 3;
    var G = "";
    var H;
    while (I < parseInt(A) + 2) {
        H = (parseInt(D[I++]) * 256);
        H += parseInt(D[I++]);
        if (I < parseInt(A) + 2) {
            G += H.toString() + "#"
        } else {
            G += H.toString()
        }
    }
    return G
}
function MBJSReadStringFromModbus(D, L, F, C) {
    var H = MBJSReadCSV(D, L, F, C);
    var E = H.split(",");
    var B = E[2];
    var K = 3;
    var J = "";
    var I = "";
    var M = "";
    while (K < parseInt(B) + 2) {
        var A = E[K++];
        var G = E[K++];
        if ((G > 32) && (G < 122)) {
            var M = String.fromCharCode(G);
            J += M.toString()
        }
        if ((A > 32) && (A < 122)) {
            var I = String.fromCharCode(A);
            J += I.toString()
        }
        if ((A == 0) || (G == 0)) {
            break
        }
    }
    return J
}
function MBJSReadModbusBytes(D, N, F, C) {
    var K = "";
    try {
        var H = MBJSReadCSV(D, N, F, C);
        K += "Read ";
        var E = H.split(",");
        K += "split ";
        var B = E[2];
        var L = 3;
        K += "numBytes=" + parseInt(B).toString();
        +", ";
        var J = "";
        var I = "";
        var O = "";
        while (L < parseInt(B) + 2) {
            K += L + " ";
            var A = E[L++];
            K += " [H=" + A;
            var G = E[L++];
            K += ",L=" + G + "] ";
            J += G.toString() + "#" + A.toString();
            if (L < parseInt(B) + 2) {
                J += "#"
            }
        }
        return J
    } catch (M) {
        throw (new Error("exStr= " + K + "::Error Reading Bytes.  Controller may be unreachable. A(" + F.toString() + "), N(" + C + "), MBCSVstr=" + H))
    }
}
function MBJSWriteModbusValues(C, K, I, B, G) {
    var A = B.length;
    var J = 0;
    var L = 0;
    var F = 0;
    while (J < A) {
        var H = 0;
        var E = 0;
        if (G != 0) {
            E = (B[J]);
            if ((J + 1) < A) {
                H = (B[J + 1])
            }
        } else {
            H = (B[J]);
            if ((J + 1) < A) {
                E = (B[J + 1])
            }
        }
        F = H * 256;
        F += E;
        var D = MBJSWriteWord(502, K, parseInt(I) + L, F, 6);
        L++;
        J++;
        J++
    }
}
function MBJSWriteStringToModbus(E, A, B, F) {
    var D = new Array();
    var C = 0;
    while (C < F.length) {
        D[C] = F.charCodeAt(C);
        C++
    }
    D[D.length] = 0;
    D[D.length] = 0;
    MBJSWriteModbusValues(E, A, B, D, 1)
}
function MBJSWriteModbusInt(E, A, B, D) {
    var C = new Array();
    C[0] = parseInt(D) >> 8;
    C[1] = parseInt(D) & 255;
    MBJSWriteModbusValues(E, A, B, C, 0)
}
function MBJSWriteModbusBytes(E, A, B, D, F) {
    var C = new Array();
    C[0] = parseInt(F) & 255;
    C[1] = parseInt(D) & 255;
    MBJSWriteModbusValues(E, A, B, C, 0)
}
function ajaxRequest() {
    // var A = ["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"];
    // if (window.ActiveXObject) {
    //     for (var B = 0; B < A.length; B++) {
    //         try {
    //             return new ActiveXObject(A[B])
    //         } catch (C) {}
    //     }
    // } else {
    //     if (window.XMLHttpRequest) {
            return new XMLHttpRequest()
        // } else {
        //     return false
        // }
    // }
}
function MBJSWriteWord(D, A, B, C) {
    try {
        var G = ajaxget(A, B, C, 6, false)
    } catch (F) {
        throw (new Error("Error writing value.  Controller may be unreachable."))
    }
    var E = G.split(",");
    if (E[1] & 128) {
        if (E[2] == 1) {
            throw (new Error("Error writing value.  Writes via web access may be disabled."))
        } else {
            throw (new Error("Error writing value."))
        }
    }
    return G
}
function MBJSCoilWrite(D, A, G, C, B) {
    try {
        var F = "";
        if (C) {
            ajaxget(A, G, 65280, 5, B)
        } else {
            ajaxget(A, G, 0, 5, B)
        }
    } catch (E) {
        throw (new Error("Error writing coil.  Controller may be unreachable."))
    }
}
function MBJSReadCSV(D, A, B, C) {
    return ajaxget(A, B, C, 4, false)
}
function ajaxget(M, H, D, G, F) {
    var L = 0;
    var I = new ajaxRequest();
    var E = "";
    var A = encodeURIComponent(M);
    var C = encodeURIComponent(G);
    var N = encodeURIComponent(parseInt(H) >> 8);
    var B = encodeURIComponent(parseInt(H) & 255);
    var J = encodeURIComponent(parseInt(D) >> 8);
    var K = encodeURIComponent(parseInt(D) & 255);
    I.open("GET", "http://10.55.0.156/MBCSV.cgi?ID=" + A + "&F=" + C + "&AHI=" + N + "&ALO=" + B + "&RHI=" + J + "&RLO=" + K, F);
    I.send(null);
    if (!F) {
        E = I.responseText
    }
    // console.log("Response: " + E);
    return E
}
;

// liveview.js
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var rowsToUpdate = new Array();
var UPDATE_FREQ_SECS = 5;
var MBID = 1;
var Vb = new ScaledValueDisplayClass(MBID, 38, "V", "fD0", "Battery Voltage", 1);
var VbT = new ScaledValueDisplayClass(MBID, 51, "V", "fD1", "Target Voltage", 1);
var IbC = new ScaledValueDisplayClass(MBID, 39, "A", "fD2", "Charge Current", 1);
var Va = new ScaledValueDisplayClass(MBID, 27, "V", "fD9", "Array Voltage", 1);
var Ia = new ScaledValueDisplayClass(MBID, 29, "A", "fD10", "Array Current", 1);
var Ib = new ScaledValueDisplayClass(MBID, 58, "W", "fD4", "Output Power", 1);
var VmpS = new ScaledValueDisplayClass(MBID, 61, "V", "fD5", "Sweep Vmp", 1);
var VocS = new ScaledValueDisplayClass(MBID, 62, "V", "fD6", "Sweep Voc", 1);
var Pmax = new ScaledValueDisplayClass(MBID, 60, "W", "fD11", "Sweep Pmax", 1);
var AhCntr = new ScaledValueDisplayClass(MBID, 52, "Ah", "fD7", "Amp Hours", 2);
var KwhCntr = new ScaledValueDisplayClass(MBID, 56, "kWh", "fD8", "Kilowatt Hours", 1);
var BTemp = new TempDisplayClass(MBID, 37, "fDBT", "Battery");
var HSTemp = new TempDisplayClass(MBID, 35, "fDHST", "Heat Sink");
var Factors = new ScaleFactors();
var ChState = ["Start", "Night Check", "Disconnect", "Night", "Fault", "MPPT", "Absorption", "Float", "Equalize"];
var AlarmsDisplay = new BitFieldTextDisplayClass(MBID, 46, 2, 1, "fDAlarms", "lblAlarm", "Alarms", "lblvalAlarm", AlarmsArray);
var FaultsDisplay = new BitFieldTextDisplayClass(MBID, 44, 1, 0, "fDAlarms", "lblError", "Faults", "lblvalError", FaultsArray);
var ChStDisp = new EnumTextDisplayClass(MBID, 50, 1, "fDChSt", "lblSt", "Charge State", "lblvalSt", ChState);
var TStamp = new TStampClass("flastU", "valLastU");
var intervalHandle = 0;

LVInit();
Vb.updateLVText();

function LVInit() {
    // ShowMenu();
    Factors.Init();
    rowsToUpdate[rowsToUpdate.length] = Vb;
    rowsToUpdate[rowsToUpdate.length] = Ib;
    rowsToUpdate[rowsToUpdate.length] = Va;
    rowsToUpdate[rowsToUpdate.length] = Ia;
    rowsToUpdate[rowsToUpdate.length] = VbT;
    rowsToUpdate[rowsToUpdate.length] = IbC;
    rowsToUpdate[rowsToUpdate.length] = ChStDisp;
    rowsToUpdate[rowsToUpdate.length] = VmpS;
    rowsToUpdate[rowsToUpdate.length] = VocS;
    rowsToUpdate[rowsToUpdate.length] = Pmax;
    rowsToUpdate[rowsToUpdate.length] = AhCntr;
    rowsToUpdate[rowsToUpdate.length] = KwhCntr;
    rowsToUpdate[rowsToUpdate.length] = BTemp;
    rowsToUpdate[rowsToUpdate.length] = HSTemp;
    rowsToUpdate[rowsToUpdate.length] = AlarmsDisplay;
    rowsToUpdate[rowsToUpdate.length] = FaultsDisplay;
    rowsToUpdate[rowsToUpdate.length] = TStamp;
    // intervalHandle = setInterval(updateAllLVText, 100)
}

function BitFieldTextDisplayClass(I, D, B, E, C, F, G, H, A) {
    this.MBID = I;
    this.MBaddress = D;
    this.frmName = C;
    this.lblName = G;
    this.lblCtrl = F;
    this.valCtrl = H;
    this.textArray = A;
    this.updateLVText = function () {
        try {
            var L = 0;
            var L = MBJSReadModbusInts(MBP, this.MBID.toString(), this.MBaddress.toString(), B);
            if (B > 1) {
                var J = L.split("#");
                L = (J[0] * (65536)) + J[1]
            }
            L = L & (~E);
            // console.log(this.lblName.toString());
            var N = "";
            var K = 0;
            if (L > 0) {
                while (K < 16) {
                    if (L & (1 << K)) {
                        if (this.textArray.length > K) {
                            if (N != "") {
                                N += "\n"
                            }
                            N += this.textArray[K]
                        }
                    }
                    K++
                }
            } else {
                N = "None"
            }
            // console.log(N);
            return 1
        } catch (M) {
            return 0
        }
    }
}

function EnumTextDisplayClass(B, C, G, F, D, H, A, E) {
    this.MBID = B;
    this.MBaddress = C;
    this.frmName = F;
    this.lblName = H;
    this.lblCtrl = D;
    this.valCtrl = A;
    this.textArray = E;
    this.updateLVText = function () {
        try {
            var J = 0;
            var J = MBJSReadModbusInts(MBP, this.MBID.toString(), this.MBaddress.toString(), G);
            if (G > 1) {
                var I = J.split("#");
                J = (parseInt(I[0]) * 65536) + parseInt(I[1])
            }
            // console.log(this.lblName.toString());
            if (this.textArray.length > J) {
                // console.log(this.textArray[J]);
            }
            return 1
        } catch (K) {
            return 0
        }
    }
}

function TempDisplayClass(A, B, C, D) {
    this.MBID = A;
    this.MBaddress = B;
    this.frmName = C;
    this.lblName = D;
    this.MBID = A;
    this.MBaddress = B;
    this.updateLVText = function () {
        try {
            var E = parseInt(MBJSReadModbusInts(MBP, this.MBID.toString(), this.MBaddress.toString(), "1"));
            E <<= 16;
            E >>= 16;
            console.log(this.lblName.toString());
            console.log(E.toString() + " \u00B0C");
            return 1
        } catch (F) {
            return 0
        }
    }
}

function TStampClass(B, A) {
    this.frmName = B;
    this.valCtrlName = A;
    this.updateLVText = function () {
        try {
            var D = new Date();
            // console.log("Last Update: " + D.toUTCString());
            return 1
        } catch (C) {
            return 0
        }
    }
}

function GetScaledValue(A, B, F, E) {
    var D = 0;
    D = MBJSReadModbusInts(MBP, A.toString(), B.toString(), E);
    if (E > 1) {
        var C = D.split("#");
        D = (parseInt(C[0]) * 65536) + parseInt(C[1])
    } else {
        D <<= 16;
        D >>= 16
    }
    if (F.toString() == "V") {
        return ((D * Factors.VScale) / 32768 / 10).toFixed(2)
    } else {
        if (F.toString() == "A") {
            return ((D * Factors.IScale) / 32768 / 10).toFixed(1)
        } else {
            if (F.toString() == "W") {
                return ((D * Factors.IScale * Factors.VScale) / 131072 / 100).toFixed(0)
            } else {
                if (F.toString() == "Ah") {
                    return (D * 0.1).toFixed(1)
                } else {
                    if (F.toString() == "kWh") {
                        return (D).toFixed(0)
                    } else {
                        return (D).toFixed(2)
                    }
                }
            }
        }
    }
}

function ScaledValueDisplayClass(A, B, F, C, E, D) {
    this.MBID = A;
    this.MBaddress = B;
    this.frmName = C;
    this.lblName = E;
    this.ScaleFactor = F;
    this.updateLVText = function () {
        try {
            console.log(this.lblName.toString());
            console.log(GetScaledValue(this.MBID, this.MBaddress, this.ScaleFactor, D).toString() + " " + this.ScaleFactor.toString());
            return 1
        } catch (G) {
            return 0
        }
    }
}

function ScaledProductDisplayClass(A, C, F, B, E, G, D, H) {
    this.MBID = A;
    this.MBaddress1 = C;
    this.MBaddress2 = B;
    this.frmName = D;
    this.lblName = H;
    this.ScaleFactor1 = F;
    this.ScaleFactor2 = E;
    this.ScaleStr = G;
    this.updateLVText = function () {
        try {
            console.log(this.lblName.toString());
            console.log((Math.round((GetScaledValue(this.MBID, this.MBaddress1, this.ScaleFactor1, 1)) * (GetScaledValue(this.MBID, this.MBaddress2, this.ScaleFactor2, 1)), 4)).toString() + this.ScaleStr.toString());
            return 1
        } catch (I) {
            return 0
        }
    }
}

function updateAllLVText() {
    clearInterval(intervalHandle);
    var B = 1;
    var A = 0;
    while ((A < rowsToUpdate.length) && B) {
        B = rowsToUpdate[A].updateLVText();
        A++
    }
    intervalHandle = setInterval(updateAllLVText, UPDATE_FREQ_SECS * 1000)
};