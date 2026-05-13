# SurveyJS Google Maps Address Widget

Allows address autocomplete and fills other questions with related address parts.

## Usage

- Add the Google Maps API using your key to your
  site: ```<script async src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&loading=async&libraries=places&v=weekly"></script>```
- In the Google Cloud project that owns the API key, enable **"Places API (New)"**.
  This widget uses `google.maps.places.PlaceAutocompleteElement` and no longer supports
  the legacy `google.maps.places.Autocomplete` (closed to new Google customers since
  2025-03-01).
- Add `surveyjs-google-maps-widget.js` to your SurveyJS site.
- Use the widget by adding a question with type `"type": "addressautocomplete"`
- The widget will show the SurveyJS input field with whatever value is currently stored
  in it. When the user clicks into the field, it is replaced by a Google
  `<gmp-place-autocomplete>` web component for searching. After the user picks a
  suggestion, specific fields of the address are stored in various questions and/or the
  autocomplete question itself (see [below](#address-parts)), and the input field
  reappears showing the matched value. The web component reappears whenever the field
  is focused again. Clicking elsewhere or pressing Escape during a search reverts to the
  input without changing the stored value.
- The autocomplete feature will be disabled if `PlaceAutocompleteElement` is not
  available on the loaded Google Maps script (e.g. the API key is missing or `Places
  API (New)` is not enabled).

### Address Parts {#address-parts}

The following names are available for target questions (including the autocomplete question itself):
- `streetName`
- `streetNumber`
- `postalCode`
- `neighborhood`
- `sublocality`: directly or the highest level provided by Google
- `city`: may also be `postal_town`, `sublocality` or `neighborhood`, depending on what is provided
- `administrativeArea`: the highest provided by Google
- `countryShort`: country code as provided by Google
- `country`
- `street`: formatted street name followed by number (if available)
- `formattedAddress`: address formatted according to Google’s format.
  This is the default assigned to the autocomplete question.

If a question with one of these names exists, it will be assigned the corresponding address part.
To allow for several autocomplete questions on the same survey, you use the name of the autocomplete
question as prefix:

An autocomplete question `address1` setting a `city` will try to find a question with the following
names (in this order):
1. `address1.city`
2. `address1city`
3. `city`

The first question found with one of these names will get the city from the corresponding address as
value. This also works with dynamic panels. In this case the address parts will only be set within
each panel; that is, each panel will be independent from other panels even from the same template.

Since the name of the autocomplete question defines the prefix of the target questions for the
address parts, assigning a specific field to the autocomplete question itself works differently.
Declare the specific field under the `Data` tab of the corresponding autocomplete question in the
SurveyJs Creator. In this way, the value to be displayed is generated in the JSON array under the
key `valueName`. But when assigning the address parts, we cannot use dot notation here, so you may
use:
1. `address1city`
2. `city`

The `valueName`, like the question name, needs to be unique with respect to the survey, because the
unspecified `valueName` is set from the first autocomplete question with matching address parts. If
`valueName : city` appears in several autocomplete widgets, then all these fields get the same
value. Therefore we recommended using unique `valueName`, e.g. autocomplete question name as prefix.

To improve readability of names, every field is also available starting with an upper-case
character. This is especially useful when combining without separator, e. g. `address1City`.

#### Example
    {
      "pages": [
        {
          "name": "page1",
          "elements": [
            {
              "type": "addressautocomplete",
              "name": "Address1"
            },
            {
              "type": "text",
              "name": "Address1postalCode"
            },
            {
              "type": "text",
              "name": "Address1city"
            },
            {
              "type": "paneldynamic",
              "name": "panelDynamic",
              "templateElements": [
                {
                  "type": "addressautocomplete",
                  "name": "Address2",
                  "valueName": "Adress2city"
                },
                {
                  "type": "text",
                  "name": "Address2postalCode"
                }
              ]
            }
          ]
        }
      ]
    }

## Development

1. Add your Google API key in index.html
2. Run `npm install`
3. Run `npm start`
4. Open the link displayed in the console
5. Start changing the files and manually refresh the browser page.

