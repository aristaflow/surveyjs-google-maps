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
        Survey.Serializer.addClass("addressautocomplete", [], null, "text");
    },
    isDefaultRender: true,
    // add Google Maps Autocomplete to the rendered text field
    afterRender: function (question, el) {
        // find the input element
        var text;
        if (el.tagName.toLowerCase() !== 'input') {
            text = el.getElementsByTagName("input")[0];
        } else {
            text = el;
        }
        text.className = "sd-input sd-text sv-text";
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
   * NameOfAutoCompleteQuestion_AddressFieldName
     * NameOfAutoCompleteQuestionAddressFieldName
     * AddressFieldName
     *
     * This allows for several autocomplete widgets on the same survey.
     */
    transferValue: function(address, parent, fieldName, thisQuestionName) {
        var targetName = thisQuestionName + '.' + fieldName;
        var cq = parent.getQuestionByName(targetName);
        if (!cq) {
      targetName = thisQuestionName + '_' + fieldName;
      cq = parent.getQuestionByName(targetName);
    }
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

  /**
   * Transfers data from the given address object to the designated target question (expected to be
   * the addressautocomplete question) and the designated target input if appropriate. This checks
   * for whether one of the designated question fields (paramName, valueName, name) contains a
   * string that represents a (possibly prefixed) field name of the designated address:
   * NameOfAutoCompleteQuestion.AddressFieldName
   * NameOfAutoCompleteQuestionAddressFieldName
   * AddressFieldName
   *
   * @return Whether the designated address field has been assigned to the designated target
   *         question and input.
   */
  transferValueToAcQuestion: function(address, qFields, aFieldName, targetQuestion, targetInput) {
    var ret = false;
    for (qFieldName of qFields) {
      if (qFieldName && (qFieldName == targetQuestion.name + '.' + aFieldName
                         || qFieldName == targetQuestion.name + aFieldName
                         || qFieldName == aFieldName)) {
        targetInput.value = address[aFieldName];
        targetQuestion.value = address[aFieldName];
        ret = true;
        break;
      }
    }
    return ret;
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
                street_name: streetName,
                streetNumber: streetNumber,
                StreetNumber: streetNumber,
                street_number: streetNumber,
                postalCode: postalCode,
                PostalCode: postalCode,
                postal_code: postalCode,
                neighborhood: neighborhood,
                Neighborhood: neighborhood,
                sublocality: sublocality,
                Sublocality: sublocality,
                city: city,
                City: city,
                administrativeArea: administrativeArea,
                AdministrativeArea: administrativeArea,
                administrative_area: administrativeArea,
                countryShort: countryShort,
                CountryShort: countryShort,
                country_short: countryShort,
                country: country,
                Country: country,
                street: streetName + ((streetNumber) ?  ' ' + streetNumber : ''),
                Street: streetName + ((streetNumber) ?  ' ' + streetNumber : ''),
                formattedAddress: formattedAddress,
                FormattedAddress: formattedAddress,
                formatted_address: formattedAddress
            };
            console.info("Retrieved address data:", place.address_components);
            console.info("Formatted address: %s", place.formatted_address);
            console.info("SurveyJS address data:", address);

            var survey = question.survey;
            var valueSet = false;
            // transfer all values (address parts) to questions, if they exist
            Object.keys(address).forEach(function(fieldName) {
                if (!question.parent) {
                    that.transferValue(address, survey, fieldName, question.name)
                } else {
                    that.transferValue(address, question.parent, fieldName, question.name)
                }

                valueSet ||= that.transferValueToAcQuestion(address, [question.paramName, question.valueName, question.name],
                                                            fieldName, question, input);
            });

            // if neither paramName nor valueName nor question name specify the fieldName, set value of
            // addressautocomplete question to the formatted address
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
} catch(e) {
    console.info("Google Autocomplete not loaded. Probably no valid API-Key provided.");
}
