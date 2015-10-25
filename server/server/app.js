var tesseract = require('node-tesseract'),
SpellChecker =  require('spellchecker'),
http = require('http'),
fs = require('fs'),
Firebase = require('firebase'),
SummaryTool = require('node-summary'),
ref = new Firebase('https://hackedu.firebaseio.com/');

ref.child('dict').on('value', function(snapshot){
    snapshot.forEach(function(childSnapshot){
        SpellChecker.add(childSnapshot.val())
    });
});

ref.child('temp').on('value', function(snapshot){
    snapshot.forEach(function(childSnapshot){
        var key = childSnapshot.key();

        downloadImage(childSnapshot.val().substring(22));
        var text = imgToText("test.jpg", function(text){
            var summary = getSummary(text);
            console.log("RAW: " + text)
            console.log("-                  -                       -                           -                         -                   -")
            console.log("SUMMARY: " + summary)
            console.log("---------------------------------------------------------------------------------------------------------------------")
            ref.child('temp').child(key).remove();
            ref.child('finished').child(key).set({
                raw: text,
                summ: summary
            })
            ;
        })

    });
});
function downloadImage(base64){
    var base64Matcher = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");

    if (!base64Matcher.test(base64)) {
        console.log("Something went wrong, the image data may not be base64 encoded.")
    }

    var imageData = new Buffer(base64, 'base64');
    fs.writeFile('images/test.jpg', imageData, function(err) {
        if(err){
            console.log(err);
        }
    });

}

function imgToText(fileName, callback){
    tesseract.process(__dirname + "/images/" + fileName ,function(err, text) {
        if(err) {
            console.error(err);
            return "";
        } else {
            callback(fixParagraphSpelling(text));
        }
    });
}

function fixParagraphSpelling(para){
    var words = para.split(/[^A-Za-z]/);
    // var words2 = para.replace(/(\b(\w{1,3})\b(\s|$))/g,'').split(" ").split(/[^A-Za-z]/);
    for(var i in words){
        if(words[i].substring(0,2) == "pa" && words[i].substring(3,5) == "ag"){
            var reg = new RegExp(words[i],"g");
            para = para.replace(reg, "paragraph");
        }
        else if(SpellChecker.isMisspelled(words[i])){
            if(SpellChecker.getCorrectionsForMisspelling(words[i])[0] != undefined){
                var reg1 = new RegExp(words[i],"g");
                para = para.replace(reg1, SpellChecker.getCorrectionsForMisspelling(words[i])[0]);
            }else{
                console.log(words[i])
            }
        }
    }

    para = para.replace(/[\n]/g, " ");

    return para
}

function getSummary(text){
    SummaryTool.summarize(" ", text, function(err, summary) {
        if(err) {
            console.log("There was an error."); // Need better error reporting
        }

        text = summary;
    });

    text = text.replace(/[\n]/g, " ");
    return text;
}


function isLetter(str) {
  return str.match(/[A-Za-z ]/i);
}



























// for(var i in words2){
//     if(words2[i].substring(0,2) == "pa" && words2[i].substring(3,5) == "ag"){
//         var reg = new RegExp(words2[i],"g");
//         para = para.replace(reg, "paragraph");
//     }
//     else if(SpellChecker.isMisspelled(words2[i])){
//         if(SpellChecker.getCorrectionsForMisspelling(words2[i])[0] != undefined && SpellChecker.getCorrectionsForMisspelling(words2[i]).length >= 5){
//             var reg1 = new RegExp(words2[i],"g");
//             para = para.replace(reg1, SpellChecker.getCorrectionsForMisspelling(words2[i])[0]);
//         }else{
//             console.log(words2[i])
//         }
//     }
// }



// //basically removes all words less than 3 length, tries same algorig
// var paraSmall = para.replace(/(\b(\w{1,3})\b(\s|$))/g,'').split(" ");
//
//     SummaryTool.summarize("", paraSmall, function(err, sorted_sentences2) {
//         if(err) {
//             console.log("There was an error."); // Need better error reporting
//         }
//         console.log("para2");
//         console.log();
//         console.log(sorted_sentences2);
//     });
