// SurveyJS wraps each question in a div (.sv-question / .sd-question) that has
// `overflow: auto`, which clips the dropdown the PlaceAutocompleteElement renders
// inside its own (closed) shadow DOM. Inject a scoped override so the dropdown
// can escape the question wrapper. Only targets question wrappers that actually
// contain a gmp-place-autocomplete, so it leaves other questions alone.
(function () {
    if (typeof document === 'undefined') return;
    if (document.getElementById('gmp-place-autocomplete-overflow-fix')) return;
    var style = document.createElement('style');
    style.id = 'gmp-place-autocomplete-overflow-fix';
    style.textContent =
        '.sv-question:has(gmp-place-autocomplete),' +
        '.sd-question:has(gmp-place-autocomplete) { overflow: visible !important; }';
    (document.head || document.documentElement).appendChild(style);
})();

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
    // add Google Places Autocomplete to the rendered text field
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
     * Retrieves from the given address-components array a component of the given type and returns
     * either the long or the short name of it. Expects the new Places API shape:
     * { longText, shortText, types }.
     */
    getAddressComponent: function(components, type, useShortName) {
        if (!components) {
            return undefined;
        }
        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            if (component.types && component.types[0] === type) {
                if (useShortName) {
                    return component.shortText;
                }
                return component.longText;
            }
        }
        return undefined;
    },
    /**
     * Retrieves the long name of the address component from the designated components array with
     * the designated hierarchical type with the lowest level. For instance, the first level of
     * 'administrative_area' (e. g. 'administrative_area_level_2') having a value will be
     * returned. Searching will start with the designated level or 1.
     */
    getAddressComponentLevel: function(components, type, startLevel) {
        var ret;
        for (var i = startLevel ? startLevel : 1; i < 6; i++) {
            var compName = type + '_level_' + i;
            ret = this.getAddressComponent(components, compName);
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
        for (var qFieldName of qFields) {
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

    /**
     * Shared place-handling pipeline. Expects the new Places API shape:
     *   components       = place.addressComponents (array of { longText, shortText, types })
     *   formattedAddress = place.formattedAddress  (string)
     * Builds the triple-keyed (camelCase / PascalCase / snake_case) address object that downstream
     * survey questions match against, then dispatches via transferValue / transferValueToAcQuestion.
     * Returns true on success, false if no components were available.
     */
    applyPlace: function(components, formattedAddress, placeLabel, question, input) {
        if (!components) {
            window.alert("The following address has not been found: '" + (placeLabel || '') + "'");
            return false;
        }

        // get the address components
        var streetName = this.getAddressComponent(components, 'route');
        var streetNumber = this.getAddressComponent(components, 'street_number');
        var postalCode = this.getAddressComponent(components, 'postal_code');
        var neighborhood = this.getAddressComponent(components, 'neighborhood');
        var sublocality = this.getAddressComponent(components, 'sublocality');
        if (!sublocality) {
            sublocality = this.getAddressComponentLevel(components, 'sublocality');
        }
        var city = this.getAddressComponent(components, 'locality');
        if (!city) {
            city = this.getAddressComponent(components, 'postal_town');
        }
        if (!city) {
            city = sublocality;
        }
        if (!city) {
            city = neighborhood;
        }
        var administrativeArea = this.getAddressComponentLevel(components, 'administrative_area');
        var countryShort = this.getAddressComponent(components, 'country', true);
        var country = this.getAddressComponent(components, 'country');
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
        console.info("Retrieved address data:", components);
        console.info("Formatted address: %s", formattedAddress);
        console.info("SurveyJS address data:", address);

        var survey = question.survey;
        var valueSet = false;
        var that = this;
        // transfer all values (address parts) to questions, if they exist
        Object.keys(address).forEach(function(fieldName) {
            if (!question.parent) {
                that.transferValue(address, survey, fieldName, question.name);
            } else {
                that.transferValue(address, question.parent, fieldName, question.name);
            }

            valueSet ||= that.transferValueToAcQuestion(address, [question.paramName, question.valueName, question.name],
                                                        fieldName, question, input);
        });

        // if neither paramName nor valueName nor question name specify the fieldName, set value of
        // addressautocomplete question to the formatted address
        if (!valueSet && formattedAddress) {
            input.value = formattedAddress;
            question.value = formattedAddress;
        }
        return true;
    },

    initMap: function(input, position, question) {
        var el;
        try {
            // Use the new Places API web component. `includedPrimaryTypes` requires
            // specific Table A primary types ('address' is rejected). The set below
            // mirrors what the legacy 'address' meta-type returned and excludes
            // business / establishment results.
            el = new google.maps.places.PlaceAutocompleteElement({
                includedPrimaryTypes: ['street_address', 'route', 'premise', 'subpremise']
            });
        } catch (e) {
            console.info("Failed to create PlaceAutocompleteElement", e);
            return;
        }

        // class is exposed so consumers can target the inner input via ::part(input)
        el.className = "sd-input sd-text sv-text";
        // Insert the web component after the SurveyJS-rendered input but start it
        // hidden: on initial render (including page reloads where SurveyJS restored
        // a previously-saved value) the user should see the stored value in the
        // input, not an empty search component. The focus handler below swaps the
        // web component in when the user clicks to re-search.
        if (input.parentNode) {
            input.parentNode.insertBefore(el, input.nextSibling);
        }
        el.style.display = 'none';

        var that = this;
        el.addEventListener('gmp-select', async function(event) {
            try {
                var place = event.placePrediction.toPlace();
                await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
                var applied = that.applyPlace(place.addressComponents, place.formattedAddress,
                                              place.displayName, question, input);
                // The new web component renders its visible text inside a closed
                // shadow DOM that we cannot override, but applyPlace has already
                // written the matched field (e.g. street name, or formattedAddress
                // as fallback) into the SurveyJS input. Hide the web component and
                // show that input so the user sees what was actually stored.
                // Focusing the input swaps the web component back in to allow
                // another search.
                if (applied) {
                    el.style.display = 'none';
                    input.style.display = '';
                }
            } catch (e) {
                console.info("PlaceAutocompleteElement selection error", e);
            }
        });

        input.addEventListener('focus', function() {
            if (el.style.display === 'none') {
                // clear any previously-selected address so the user starts a fresh
                // search rather than seeing the formatted address of the last pick
                el.value = '';
                el.setAttribute('value', '');
                el.style.display = '';
                input.style.display = 'none';
                el.focus();
            }
        });

        // Revert to the SurveyJS input when the user dismisses the web component
        // without picking anything — either by clicking elsewhere (blur) or by
        // pressing Escape. The deferred hide on blur lets gmp-select fire first if
        // the user actually clicked a suggestion; if it does, that handler toggles
        // visibility and this becomes a no-op.
        el.addEventListener('blur', function() {
            setTimeout(function() {
                if (el.style.display !== 'none') {
                    el.style.display = 'none';
                    input.style.display = '';
                }
            }, 0);
        });
        el.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                el.blur();
            }
        });
    }
}

// Register the widget in the custom widget collection if the new Places API
// (PlaceAutocompleteElement) is available.
try {
    google.maps.places.PlaceAutocompleteElement;

    Survey.CustomWidgetCollection.Instance.addCustomWidget(addressautocomplete, "addressautocomplete");

    // Register the paramName as a question property so it appears in the
    // SurveyJS Creator's general tab. transferValueToAcQuestion already reads
    // question.paramName regardless of whether it is registered.
    if (!Survey.Serializer.findProperty('question', 'paramName')) {
        Survey.Serializer.addProperty('question', { name: 'paramName', category: 'general', default: null });
    }
} catch(e) {
    console.info("Google PlaceAutocompleteElement not loaded. Probably no valid API-Key provided or 'Places API (New)' not enabled.");
}
