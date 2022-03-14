Survey
    .StylesManager
    .applyTheme("modern");

var json = {
    "elements": [
        {
            "name": "Address",
            "type": "addressautocomplete",
            "isRequired": true
        }, {
            "name": "postalCode",
            "type": "text",
            "isRequired": true,
            "title": "Postal Code"
        }, {
            "name": "city",
            "type": "text",
            "isRequired": true,
            "title": "City",
            "startWithNewLine": false
        }, {
            "name": "country",
            "type": "text",
            "isRequired": true,
            "title": "Country"
        }
    ],
    "showQuestionNumbers": "off"
};

window.survey = new Survey.Model(json);

survey
    .onComplete
    .add(function (sender) {
        document
            .querySelector('#surveyResult')
            .textContent = "Result JSON:\n" + JSON.stringify(sender.data, null, 3);
    });

var app = new Vue({
    el: '#surveyElement',
    data: {
        survey: survey
    }
});

