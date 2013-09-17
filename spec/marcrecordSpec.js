var r = new MarcRecord(
    {
        leader: 'skdjfhskdfsdf',
        fields: [
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
                    't', 'xyzzy',
                    'X', 'syzygy',
                    '9', 'ZxzXz'
                ]
            },
            '245', {
                ind1: '#', ind2: '#',
                subfields: [
                    'a', 'A Title:',
                    'b', 'of sorts'
                    ]
            },
            '100', {
                ind1: '', ind2: ' ',
                subfields: [
                'a', 'The Man' ]
            },
            '700', {
                ind1: '#', ind2: '#',
                subfields: [
                'a', 'uhuhuhgh' ]
            },
            '700', {
                ind1: '#', ind2: '#',
                subfields: [
                'a', 'pokpok' ]
            }
        ]
    }
);

describe('Object tests', function() {
    it('is a MarcRecord object', function() {
        expect(r instanceof MarcRecord).toBeTruthy();
    });
});

describe('Fetch leader', function() {
    it('can retrieve leader', function() {
        expect(r.leader()).toBe('skdjfhskdfsdf');
    });
});

describe('Fetch fields', function() {
    it('Fetch multiple fields', function() {
        expect(r.fields('006').length).toEqual(2);
    });
    it('Fetch a subfield', function(){
        expect(r.subfield('040a')).toEqual("21234");
    });
    it('Fetch one field', function() {
        expect(r.field('006').data).toBe('98234k2j3h4kj');
    });
    it('Fetch no field', function() {
        expect(r.field('007')).toBeNull();
    });
    it('Fetch fields with regex', function() {
        // FIXME: regex only works in some cases, since we're limited to 3 chars. 
        expect(r.fields('..6').map(
                function(f){return (f.is_control_field()) ? f.data : f.subfield('b');}
            )).toEqual(
                ["98234k2j3h4kj", "kwjrkwerwerwe", "zzyzzy"]
        );
    });
});

describe('Fetch control fields', function() {
    it('Fetch all positions', function() {
        expect(r.ctrl('006')).toBe('98234k2j3h4kj');
    });
    it('Fetch single position', function() {
        expect(r.ctrl('006[2]')).toBe('2');
    });
    it('Fetch range of positions', function() {
        expect(r.ctrl('006[4-6]')).toBe('4k2');
    });
});

describe('Fetch subfields', function() {
    it('Fetch all subfields from a field', function() {
        expect(r.field('040').subfields('acbdez')).toEqual(
            [ 'a', '21234', 'z', 'sldkflsd' ]);
    });
    it('Fetch one subfield', function() {
        expect(r.subfield('040a')).toBe('21234');
    });
    it('Fetch one subfield with regex', function() {
        expect(r.subfield('01.b')).toBe('zzyzzy');
    });
});

describe('Fetch indicators', function(){
    it('Fetch indicator values with string', function(){
        expect(r.field('016').indicator('1')).toEqual('1');
    });
    it('Fetch indicator values with number', function(){
        expect(r.field('016').indicator(1)).toEqual('1');
    });
});

describe('Filter subfields', function(){
    it('Fetch some subfields', function(){
        expect(r.field('016').filter('X9').subfields()).toEqual(
            [ 'X', 'syzygy', '9', 'ZxzXz' ]);
    });
});

describe('MARC-HTML output', function(){
    it('Fetch field as marc-html', function(){
        expect(r.field('016').filter('t').html()).toEqual(
            '<span class="marcfield marc016 marc0XX marc-i11 marc-i2"><span class="subfield marc016t">xyzzy</span></span>'
            );
    });
});

describe('Title', function(){
    it('can be retrieved', function(){
        expect(r.title()).toEqual( "A Title: of sorts" );
    });
});

describe('COinS', function(){
    it('can be generated', function(){
        expect(r.coins()).toEqual( "ctx_ver=Z39.88-2004&rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook&rft.btitle=A+Title%3A+of+sorts&rtf.au%5B%5D=The+Man&rtf.au%5B%5D=uhuhuhgh&rtf.au%5B%5D=pokpok" );
    });
});

describe('Boolean test methods', function() {
    it('Does have a field', function() {
        expect(r.has('040')).toBeTruthy();
    });
    it('Does not have a field', function() {
        expect(r.has('041')).toBeFalsy();
    });
});
