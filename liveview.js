var rowsToUpdate = new Array();
var UPDATE_FREQ_SECS = 5;
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

function LVInit() {
    ShowMenu();
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
    intervalHandle = setInterval(updateAllLVText, 100)
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
            document.forms[this.frmName].elements[this.lblCtrl.toString()].value = this.lblName.toString();
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
            document.forms[this.frmName].elements[this.valCtrl.toString()].value = N;
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
            document.forms[this.frmName].elements[this.lblCtrl.toString()].value = this.lblName.toString();
            if (this.textArray.length > J) {
                document.forms[this.frmName].elements[this.valCtrl.toString()].value = this.textArray[J]
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
            document.forms[this.frmName].elements.lblDataName.value = this.lblName.toString();
            document.forms[this.frmName].elements.lblcurrentValue.value = E.toString() + " \u00B0C";
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
            document.forms[this.frmName].elements[this.valCtrlName].value = "Last Update: " + D.toUTCString();
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
            document.forms[this.frmName].elements.lblDataName.value = this.lblName.toString();
            document.forms[this.frmName].elements.lblcurrentValue.value = GetScaledValue(this.MBID, this.MBaddress, this.ScaleFactor, D).toString() + " " + this.ScaleFactor.toString();
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
            document.forms[this.frmName].elements.lblDataName.value = this.lblName.toString();
            document.forms[this.frmName].elements.lblcurrentValue.value = (Math.round((GetScaledValue(this.MBID, this.MBaddress1, this.ScaleFactor1, 1)) * (GetScaledValue(this.MBID, this.MBaddress2, this.ScaleFactor2, 1)), 4)).toString() + this.ScaleStr.toString();
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
