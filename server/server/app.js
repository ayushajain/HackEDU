var tesseract = require('node-tesseract'),
SpellChecker =  require('spellchecker'),
http = require('http'),
fs = require('fs'),
pos = require('pos'),
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

            var questionsArray = getQuestionAnswers(text)
            ref.child('temp').child(key).remove();
            ref.child('finished').child(key).set({
                raw: text,
                summ: summary

            });
            console.log(questionsArray)
            var count = 1;
            for(var i = 0; i < questionsArray.length; i+=2){
                if(questionsArray[i] && questionsArray[i+1]){
                    ref.child('finished').child(key).child('questions').child(count).set({
                        q: questionsArray[i],
                        a: questionsArray[i+1]
                    })
                    count++;
                }
            }
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


// QUESTION CREATION ALGORITHM
function getQuestionAnswers(paragraph) {
    var sentences = paragraph.split(". ");
    sentences.pop();

    for (i in sentences) {
        sentences[i] = sentences[i].trim();
    }

    // Filter, sentence-number of selected sentences stored in array bellow
    var selectedSentences = selectSentences(sentences);

    // taggedWords: tag version of selected sentences, corresponding sentence-number in selectedSentences

    var taggedSentences = [];

        var len = selectedSentences.length;

        for (var i = 0; i < len; i++) {
            var words = new pos.Lexer().lex(sentences[selectedSentences[i]]);
            var tagger = new pos.Tagger();
            var taggedWords = tagger.tag(words);
            taggedSentences.push(taggedWords);
        }


    var selectedKeys = KeysForSentences(selectedSentences, taggedSentences);
    var finalArray = finalize(selectedKeys, selectedSentences, taggedSentences);

    return finalArray;

    //console.log(finalArray);
}

//////////////

function finalize(selectedKeys, selectedSentences, taggedSentences) {
    var finalArr = [];

    for (i in selectedSentences) {
        var sentNum = selectedSentences[i];
        var keys = selectedKeys[i];

        var keyleco = Math.floor(Math.random()*keys.length)
        var question = replacedQuestion(sentNum, taggedSentences, keys[keyleco]);


        var answers = generateDistractors(keys[j]);

        finalArr.push(question);
        finalArr.push(answers[keyleco]);


    }

    return finalArr;
}

function generateDistractors(key) {
    var list = [key];

    return list;
}

function replacedQuestion(sentNum, taggedSentences, key) {
    var question = "";
    for (i in taggedSentences[sentNum]) {

        var word = taggedSentences[sentNum][i];

        if (word[0] === key) {

            question+= " ______ ";
        } else {
            question+=" "+word[0]+" ";
        }
    }

    return question.trim()+".";
}


///////////// KEY LIST FORMATION /////////////

function KeysForSentences(selectedSentences, taggedSentences) {
    var keysForSentences = [];

    for (i in selectedSentences) {
        keysForSentences.push(returnKeyList(taggedSentences[i]));
    }

    return keysForSentences;
}

function returnKeyList(taggedSentence) {

    // word pos then word
    var keyList = [];

    var inNounPhrase = false;
    var hasCC = false;

    var string = [];

    for (var i = taggedSentence.length-1; i >= 0; i--) {

        var key = taggedSentence[i][1];
        var word = taggedSentence[i][0];

        if (key === 'NN' || key === 'NNP' || key === 'NNPS' || key === 'NNS' || key === 'LS') {
            hasCC = false;
            inNounPhrase = true;
            string.push(" "+word);

        } else if (inNounPhrase && (key === 'JJ' || key === 'JJR' || key === 'JJS' )) {

            string.push(" "+word);

        } else {
            inNounPhrase = false;

            if (string.toString().trim() !== "") {
                string = string.reverse();

                for (j in string) {
                    keyList.push(string[j].trim());
                }

                string = [];

            } else {
                string = [];
            }
        }
    }

    return keyList;
}

//////////////// SENTENCE SELECTION ////////////////


// SelectSentences based on mean amount of nouns

function selectSentences(sentences) {
    // sentence, number of nouns, length
    var selectedSentences = [];
    var sentenceNounCounts = [];

    var len = sentences.length;

    var total = 0;

    for (var i = 0; i < len; i++) {
        var nounCount = nounPositions(sentences[i]).length;
        total+= nounCount;

sentenceNounCounts.push(nounCount);

    }

    var mean = total/len;

    for (var i = 0; i < len; i++) {
        var nounCount = sentenceNounCounts[i];
        if (nounCount >= mean) {
            selectedSentences.push(i);
        }
    }

    return selectedSentences;
}

// Get positions of all nouns in sentence
function nounPositions(taggedWords) {

    var count = 0;
    var nounPos = [];

    for (var i in taggedWords) {
        var taggedWord = taggedWords[i];
        var tag = taggedWord[1];
        if (tag==='NN' || tag==='NNP' || tag==='NNPS' || tag==='NNS') {
            ++count;
            nounPos.push(i);
        }
    }

    return nounPos;
}
