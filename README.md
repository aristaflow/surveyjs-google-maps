# SurveyJS Google Maps Address Widget

Allows address autocomplete and fills other questions with related address parts.

## Usage

- Add the Google Maps API using your key to your
  site: ```<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>```
- Add `surveyjs-google-maps-widget.js` to your SurveyJS site.
- Use the widget by adding a question with type`"type": "addressautocomplete"`
- The widget will enable Google Maps autocomplete on the question and will store the formatted
  address or the address part corresponding to the question name. Other question values will be
  updated using their name for specific address parts.

### Address Parts

Questions with the following name will be automatically filled with the related address part of the
place, if the question is available and the place has a value for the data.

- `streetName`
- `streetNumber`
- `postalCode`
- `neighborhood`
- `sublocality`: directly or the highest level provided by Google
- `city`: may also be `postal_town`, `sublocality` or `neighborhood, depending on what is provided
- `administrativeArea`: the highest provided by Google
- `countryShort`: country code as provided by Google
- `country`
- `street`: formatted street name followed by number (if available)
- `formattedAddress`: address formatted according to Google’s format

## Development

1. Add your Google API key in index.html
2. Run `npm install`
3. Run `npm start`
4. Open the link displayed in the console
5. Start changing the files and manually refresh the browser page.
