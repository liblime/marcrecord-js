function MarcRecord(marc) {
    this.marc = marc;

    this.leader = function() {
        return this.marc.leader;
    }

    this.fields = function(tag) {
        var out = [];
        var tag_re = new RegExp(tag);
        for (var i = 0; i < this.marc.fields.length-1; i+=2) {
            if ( tag_re.test(this.marc.fields[i]) ) {
                out.push([this.marc.fields[i], this.marc.fields[i+1]]);
            }
        }
        return out;
    };

    this.field = function(tag) {
        var fields = this.fields(tag);
        return (fields.length == 0) ? undefined : fields[0][1];
    };

    this.has = function (tag) {
        return this.fields(tag).length > 0;
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

    this.ctrl = function(ctrlspec) {
        var tag = ctrlspec.substr(0, 3);
        var pos = ctrlspec.substr(4).replace(/\[|\]/g, '').split(/-/);
        if (pos[0] === '') {
            return this.field(tag);
        }
        else if (pos.length === 1) {
            return this.field(tag).substr(pos[0], 1);
        }
        else if (pos.length === 2) {
            return this.field(tag).substr(pos[0], pos[1] - pos[0] + 1);
        }
    };
}
