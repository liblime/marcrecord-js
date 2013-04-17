function MarcRecord(marc) {
    this.marc = marc;

    this.fields = function(tag) {
        var out = [];
        var tag_re = new RegExp(tag);
        for (var i = 0; i < this.marc.length-1; i+=2) {
            if ( tag_re.test(this.marc[i]) ) {
                out.push([this.marc[i], this.marc[i+1]]);
            }
        }
        return out;
    };

    this.field = function(tag) {
        var fields = this.fields(tag);
        return (fields.length == 0) ? undefined : fields[0][1];
    };

    this.subfields = function(tagspec) {
        var tag = tagspec.substr(0, 3);
        var needles = tagspec.substr(3).split('');
        var haystack = this.field(tag).subfields;
        var out = [];
        for (var i = 0; i < haystack.length-1; i+=2) {
            for (var j = 0; j < needles.length; j++) {
                if (haystack[i] === needles[j]) {
                    out.push([ tag + haystack[i], haystack[i+1]]);
                    break;
                }
            }
        }
        return out;
    };

    this.subfield = function(tagspec) {
        var subfields = this.subfields(tagspec.substr(0, 4));
        return (subfields.length == 0) ? undefined : subfields[0][1];
    };
}

var r = new MarcRecord(
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
        },
        '016', {
            ind1: '1', ind2: ' ',
            subfields: [
                'b', 'zzyzzy',
                'b', 'zzxyyx',
                't', 'xyzzy'
            ]
        }
    ]
);

print('IS MarcRecord:'+(r instanceof MarcRecord));
print('ALL FIELDS:'+r.fields('006'))
print('ONE FIELD:'+r.field('006'))
print('NO FIELD:'+r.field('007'))
print('REGEX FIELDS:'+r.fields('..6'))
print('ALL SUBFIELDS:'+r.subfields('040abcdez'))
print('ONE SUBFIELD:'+r.subfield('040a'))
print('REGEX SUBFIELD:'+r.subfield('01.b'))
