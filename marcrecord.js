function marcRecord(marc) {
    this.tags = [], this.values = [];
    for (var i = 0; i < marc.length - 1; i += 2) {
        this.tags.push(marc[i]);
        this.values.push(marc[i+1]);
    }

    this.fields = function(tag) {
        var out = [];
        for (var i = 0; i < this.tags.length; i++) {
            if ( this.tags[i] === tag ) {
                out.push([this.tags[i], this.values[i]]);
            }
        }
        return out;
    }

    this.field = function(tag) {
        var fields = this.fields(tag);
        return (fields.length == 0) ? undefined : fields[0][1];
    }

    this.subfields = function(tagspec) {
        var tag = tagspec.substr(0, 3);
        var needles = tagspec.substr(3).split('');
        var field = this.field(tag);
        var haystack = field.subfields;
        var out = [];
        for (var i = 0; i < haystack.length-1; i+=2) {
            for (var j = 0; j < needles.length; j++) {
                if (haystack[i] === needles[j]) {
                    out.push([ haystack[i], haystack[i+1]]);
                    break;
                }
            }
        }
        return out;
    }

    this.subfield = function(tagspec) {
        var subfields = this.subfields(tagspec.substr(0, 4));
        return (subfields.length == 0) ? undefined : subfields[0][1];
    }
}

var r = new marcRecord(
    [
        '001', 'asdfgdfgdf',
        '006', '98234k2j3h4kj',
        '006', 'kwjrkwerwerwe',
        '040', {
            ind1: ' ', ind2: ' ',
            subfields: [
                'a', '21234',
                'z', 'sldkflsd'
            ]
        }
    ]
);

print('is marcRecord:'+(r instanceof marcRecord));

print('ALL FIELDS:'+r.fields('006'))
print('ONE FIELD:'+r.field('006'))
print('FIELD DNE:'+r.field('007'))
print('ALL SUBFIELDS:'+r.subfields('040abcdez'))
print('ONE SUBFIELD:'+r.subfield('040a'))
