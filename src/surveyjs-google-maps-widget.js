var addressautocomplete = {
    name: "addressautocomplete",
    title: "Google Map Address Auto Complete Widget",
    iconName: "",
    widgetIsLoaded: function () {
        // always load, also if maps is unavailable
        return true;
    },
    isFit: function (question) {
        return question.getType() === 'addressautocomplete';
    },
    activatedByChanged: function (activatedBy) {
        Survey.JsonObject.metaData.addClass("addressautocomplete", [], null, "text");
    },
    isDefaultRender: true,
    // add Google Maps Autocomplete to the rendered text field
    afterRender: function (question, el) {
        // find the input element
        var text;
        if (el.tagName.toLowerCase() !== 'input') {
            text = el.getElementsByTagName("input")[0];
        }
        else {
            text = el;
        }
        text.className = "sv-text";
        this.initMap(text, {}, question);
    },
    willUnmount: function (question, el) {
    },
    /**
     * Retrieves from the given place an address component of the given type and returns either
     * the long or the short name of it.
     */
    getAddressComponent: function(place, type, useShortName) {
        for (var i = 0; i<place.address_components.length; i++) {
            var component = place.address_components[i];
            if (component.types[0] === type) {
                if (useShortName) {
                    return component.short_name;
                }
                return component.long_name;
            }
        }
    },
    /**
     * Retrieves the long name of the address component from the designated place with the
     * designated hierarchical type with the lowest level. For instance, the first level of
     * 'administrative_area' (e. g. 'administrative_area_level_2') having a value will be
     * returned. Searching will start with the designated level or 1.
     */
    getAddressComponentLevel: function(place, type, startLevel) {
        var ret;
        for (var i = startLevel ? startLevel : 1; i < 6; i++) {
            var compName = type + '_level_' + i;
            ret = this.getAddressComponent(place, compName);
            if (ret) {
              return ret;
            }
        }
        return ret;
    },
    /**
     * Transfers data from the given address object to the survey by matching on the question's
     * name, if available. Target questions will be searched in the designated parent element using
     * the following (question) names:
     * NameOfAutoCompleteQuestion.AddressFieldName
     * NameOfAutoCompleteQuestionAddressFieldName
     * AddressFieldName
     *
     * This allows for several autocomplete widgets on the same survey.
     */
    transferValue: function(address, parent, fieldName, thisQuestionName) {
        var targetName = thisQuestionName + '.' + fieldName;
        var cq = parent.getQuestionByName(targetName);
        if (!cq) {
          targetName = thisQuestionName + fieldName;
          cq = parent.getQuestionByName(targetName);
        }
        if (!cq) {
          targetName = fieldName;
          cq = parent.getQuestionByName(targetName);
        }

        if (cq) {
            cq.value = address[fieldName];
        }
    },
    initMap: function(input, position, question) {
        var autocomplete = new google.maps.places.Autocomplete(input);

        // we only need the address_component(s)
        autocomplete.setFields(['address_component', 'formatted_address']);
        var that = this;
        // listen to place_changed events
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.address_components) {
                // show a simple error, in case the user entered an invalid address
                window.alert("The following address has not been found: '" + place.name + "'");
                return;
            }

            // get the address components
            var streetName = that.getAddressComponent(place, 'route');
            var streetNumber = that.getAddressComponent(place, 'street_number');
            var postalCode = that.getAddressComponent(place, 'postal_code');
            var neighborhood = that.getAddressComponent(place, 'neighborhood');
            var sublocality = that.getAddressComponent(place, 'sublocality');
            if (!sublocality) {
                sublocality = that.getAddressComponentLevel(place, 'sublocality')
            }
            var city = that.getAddressComponent(place, 'locality');
            if (!city) {
                city = that.getAddressComponent(place, 'postal_town');
            }
            if (!city) {
                city = sublocality;
            }
            if (!city) {
                city = neighborhood;
            }
            var administrativeArea = that.getAddressComponentLevel(place, 'administrative_area');
            var countryShort = that.getAddressComponent(place, 'country', true);
            var country = that.getAddressComponent(place, 'country');
            var formattedAddress = place.formatted_address;
            var address = {
                streetName: streetName,
                StreetName: streetName,
                streetNumber: streetNumber,
                StreetNumber: streetNumber,
                postalCode: postalCode,
                PostalCode: postalCode,
                neighborhood: neighborhood,
                Neighborhood: neighborhood,
                sublocality: sublocality,
                Sublocality: sublocality,
                city: city,
                City: city,
                administrativeArea: administrativeArea,
                AdministrativeArea: administrativeArea,
                countryShort: countryShort,
                CountryShort: countryShort,
                country: country,
                Country: country,
                street: streetName + ((streetNumber) ?  ' ' + streetNumber : ''),
                Street: streetName + ((streetNumber) ?  ' ' + streetNumber : ''),
                formattedAddress: formattedAddress,
                FormattedAddress: formattedAddress
            };
            console.info("Retrieved address data:", place.address_components)
            console.info("Formatted address: %s", place.formatted_address);
            console.info("SurveyJS address data:", address);

            var survey = question.survey;
            var valueSet = false;
            // transfer all values to questions, if they exist
            Object.getOwnPropertyNames(address).forEach(function(fieldName) {
                if (!question.parent) {
                    that.transferValue(address, survey, fieldName, question.name)
                } else {
                    that.transferValue(address, question.parent, fieldName, question.name)
                }

                // prefer the value name over the question name
                if (!valueSet && question.name + fieldName == question.valueName) {
                  input.value = address[fieldName];
                  question.value = address[fieldName];
                  valueSet = true;
                }
                // only use the question name if no valueName is set
                else if (!valueSet && !question.valueName && fieldName == question.name) {
                  input.value = address[fieldName];
                  question.value = address[fieldName];
                  valueSet = true;
                }
            });
            if (!valueSet) {
              input.value = place.formatted_address;
              question.value = place.formatted_address;
            }
        });

        // set the lookup type to address
        autocomplete.setTypes(['address']);
        // set strict bounds
        autocomplete.setOptions({strictBounds: true});
    }
}

// Register the widget in the custom widget collection if available.
try {
    google.maps.places.Autocomplete;

    Survey.CustomWidgetCollection.Instance.addCustomWidget(addressautocomplete, "addressautocomplete");
}
catch(e) {
    console.info("Google Autocomplete not loaded. Probably no valid API-Key provided.");
}
