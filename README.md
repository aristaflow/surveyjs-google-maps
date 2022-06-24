# SurveyJS Google Maps Address Widget

Allows address autocomplete and fills other questions with related address parts.

## Usage

- Add the Google Maps API using your key to your
  site: ```<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>```
- Add `surveyjs-google-maps-widget.js` to your SurveyJS site.
- Use the widget by adding a question with type`"type": "addressautocomplete"`
- The widget will enable Google Maps Autocomplete on the question and will retrieve the
  correpsonding from Google. Afterwards specific fields of the address will be stored in various
  questions and/or the autocomplete question itself. See [below](#address-parts).
- The autocomplete feature will be disabled if Google Maps Autocomplete is not available, e. g. the
  API key is missing.

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
- `formattedAddress`: address formatted according to Google’s format
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
address parts, assigning a specific field to the autocomplete question works differently. Use
`valueName` of the corresponding question for specifying the address part. Also note, that `.` is
not allowed here, so you may use:
1. `address1city`
2. `city`
While the second name will be assigned the corresponding value even when having several autocomplete
widgets, the resulting JSON will loose this value since the `valueName` needs to be unique with
respect to the survey.

To improve readability, every field is also available starting with an upper-case character. This is
especially useful when combining without separator, e. g. `address1City`.

#### Example
> {
>   "pages": [
>     {
>       "name": "page1",
>       "elements": [
>         {
>           "type": "addressautocomplete",
>           "name": "Address1",
>         },
>         {
>           "type": "text",
>           "name": "Address1postalCode"
>         },
>         {
>           "type": "text",
>           "name": "Address1city",
>         },
>         {
>           "type": "paneldynamic",
>           "name": "panelDynamic",
>           "templateElements": [
>             {
>               "type": "addressautocomplete",
>               "name": "Address2"
>               "valueName": Adress2city
>             },
>             {
>               "type": "text",
>               "name": "Address2postalCode"
>             },
>           ]
>         }
>       ]
>     }
>   ]
> }

## Development

1. Add your Google API key in index.html
2. Run `npm install`
3. Run `npm start`
4. Open the link displayed in the console
5. Start changing the files and manually refresh the browser page.

