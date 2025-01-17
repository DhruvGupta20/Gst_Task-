// const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.createDocument = onRequest(async (req, res) => {
  // Grab the text parameter.
  const name = req.query.name;
  const totalBookingAmount = req.query.amount;

  const writeResult = await getFirestore().collection("gst").add({
    name: name,
    totalBookingAmount: totalBookingAmount,
    status: "unfinished",
  });
  // Send back a message that we've successfully written the message
  res.json({ result: `Document with ID: ${writeResult.id} added.` });
});

exports.modifyDocument = onRequest(async (req, res) => {
  // this will change the status field
  const docId = req.query.docId;

  const docRef = getFirestore().collection("gst").doc(docId);
  docRef
    .update({ status: "finished" })
    .then(() => {
      res.json({ message: "Document updated" });
    })
    .catch((err) => {
      console.error(err);
    });
});

exports.gstInvoice = onDocumentUpdated("/gst/{docId}", async (event) => {
  const beforeData = event.data.before.data();
  const after = event.data.after.data();
  if (after.status === "finished") {
    const amount = beforeData.totalBookingAmount;

    // here the assumed tax slab is 18%
    const gstAmount = Math.round((amount * 18) / 100);
    const cgst = gstAmount / 2;
    const igst = gstAmount / 2;

    const res = await fetch(
      "https://my.gstzen.in/~gstzen/a/post-einvoice-data/einvoice-json/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Token: "de3a3a01-273a-4a81-8b75-13fe37f14dc6",
        },
        body: JSON.stringify({
          Version: "1.1",
          TranDtls: {
            TaxSch: "GST",
            SupTyp: "B2B",
            RegRev: "N",
            IgstOnIntra: "N",
          },
          DocDtls: {
            Typ: "INV",
            No: "23-24/DEM/54",
            Dt: "22/01/2025",
          },
          SellerDtls: {
            Gstin: "29AADCG4992P1ZP",
            LglNm: "GSTZEN DEMO PRIVATE LIMITED",
            Addr1: "Manyata Tech Park",
            Loc: "BANGALORE",
            Pin: 560077,
            Stcd: "29",
          },
          BuyerDtls: {
            Gstin: "06AAMCS8709B1ZA",
            LglNm: "Quality Products Private Limited",
            Pos: "06",
            Addr1: "133, Mahatma Gandhi Road",
            Loc: "HARYANA",
            Pin: 121009,
            Stcd: "06",
          },
          DispDtls: {
            Nm: "Maharashtra Storage",
            Addr1: "133, Mahatma Gandhi Road",
            Loc: "Bhiwandi",
            Pin: 400001,
            Stcd: "27",
          },
          ShipDtls: {
            Gstin: "URP",
            LglNm: "Quality Products Construction Site",
            Addr1: "Anna Salai",
            Loc: "Chennai",
            Pin: 600001,
            Stcd: "33",
          },
          ItemList: [
            {
              ItemNo: 0,
              SlNo: "1",
              IsServc: "N",
              PrdDesc: "Computer Hardware - Keyboard and Mouse",
              HsnCd: "110311",
              Qty: 25,
              FreeQty: 0,
              Unit: "PCS",
              UnitPrice: 200,
              TotAmt: 5000,
              Discount: 0,
              PreTaxVal: 0,
              AssAmt: 5000,
              GstRt: 18,
              IgstAmt: 900,
              CgstAmt: 0,
              SgstAmt: 0,
              CesRt: 0,
              CesAmt: 0,
              CesNonAdvlAmt: 0,
              StateCesRt: 0,
              StateCesAmt: 0,
              StateCesNonAdvlAmt: 0,
              OthChrg: 0,
              TotItemVal: 5900,
            },
          ],
          ValDtls: {
            AssVal: 5000,
            CgstVal: 0,
            SgstVal: 0,
            IgstVal: 900,
            CesVal: 0,
            StCesVal: 0,
            Discount: 0,
            OthChrg: 0,
            RndOffAmt: 0,
            TotInvVal: 5900,
          },
        }),
      }
    );
    const resjson = await res.json();
    // console.log(resjson);
    if (resjson.status == 1) {
      return event.data.after.ref.set(
        { cgst, igst, status: "done", irn: resjson.Irn, AckNo: resjson.AckNo },
        { merge: true }
      );
    }
  } else {
    console.log("This Document cannot be processed as of now");
  }
});
