var marcjson = {
        leader: '01033cam a22003378a 4500',
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
                ind1: ' ', ind2: ' ',
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
                ind1: ' ', ind2: ' ',
                subfields: [
                'a', 'uhuhuhgh' ]
            },
            '700', {
                ind1: ' ', ind2: ' ',
                subfields: [
                'a', 'pokpok' ]
            }
        ]
    };
var r = new MarcRecord(marcjson);

describe('Object tests', function() {
    it('is a MarcRecord object', function() {
        expect(r instanceof MarcRecord).toBeTruthy();
    });
});

describe('Fetch leader', function() {
    it('can retrieve leader', function() {
        expect(r.leader()).toBe('01033cam a22003378a 4500');
    });
});

describe('Round trip', function() {
    it('does not munge marcjson', function() {
        expect(r.toJSON()).toEqual(marcjson);
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
        expect(r.field('040').subfields()).toEqual(
            [ { code: 'a', value: '21234'}, { code: 'z', value: 'sldkflsd'} ]);
    });
    it('Fetch some subfields from a field', function() {
        expect(r.field('040').subfields('acbd')).toEqual(
            [ { code: 'a', value: '21234'} ]);
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
        expect(r.field('016').subfields('X9')).toEqual(
            [ { code: 'X', value: 'syzygy' }, { code: '9', value: 'ZxzXz'} ]);
    });
});

describe('MARC-HTML output', function(){
    it('Fetch field as marc-html', function(){
        expect(r.field('016').html({filter: 't'})).toEqual(
            '<span class="marcfield marc016 marc0XX marc-i11 marc-i2"><span class="subfield marc016t">xyzzy</span></span>'
            );
    });
    it('Fetch field as marc-html, with repeated subfield.', function(){
        expect(r.field('016').html({filter: '9b'})).toEqual(
            '<span class="marcfield marc016 marc0XX marc-i11 marc-i2"><span class="subfield marc016b">zzyzzy</span><span class="subfield marc016b">zzxyyx</span><span class="subfield marc0169">ZxzXz</span></span>'
            );
    });
    it('Fetch field as marc-html, reordered.', function(){
        expect(r.field('016').html({filter: 't9Xb', reorder: true})).toEqual(
            '<span class="marcfield marc016 marc0XX marc-i11 marc-i2"><span class="subfield marc016t">xyzzy</span><span class="subfield marc0169">ZxzXz</span><span class="subfield marc016X">syzygy</span><span class="subfield marc016b">zzyzzy</span><span class="subfield marc016b">zzxyyx</span></span>'
            );
    });
});

describe('Variable Field Mutation', function(){
    var added_field, deleted_field;
    beforeEach(function(){
        added_field = r.add_field('111',7);
    });
    afterEach(function(){
        deleted_field = r.delete_field(7);
    });

    it('can add a field', function(){
        expect(r.fields('1..').length).toEqual( 2 );
        expect(r.fields('1..')[0].tag).toEqual('111');
    });
    it('can delete a field', function(){
        expect(added_field.tag).toEqual(deleted_field.tag);
        //expect(r.toJSON()).toEqual(marcjson);
    });
});

describe('Control Field Mutation', function(){
    var old_ldr = r.leader();
    afterEach(function(){
        r.field('000').replace(old_ldr);
    });
    it('can replace control field', function(){
        var ldr = r.field('000');
        ldr.replace('INVALID LEADER');
        expect(r.leader()).toEqual( 'INVALID LEADER' );
    });
    it('can splice control field', function(){
        var ldr = r.field('000');
        ldr.replace('XX','[04-05]').replace('Y','[22]');
        expect(r.leader()).toEqual('0103XXam a22003378a 45Y0');
    });
});

describe('Title', function(){
    it('can be retrieved', function(){
        expect(r.title()).toEqual( "A Title" );
    });
});

describe('COinS', function(){
    it('can be generated', function(){
        expect(r.coins()).toEqual( "ctx_ver=Z39.88-2004&rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook&rft.btitle=A+Title&rtf.au%5B%5D=The+Man&rtf.au%5B%5D=uhuhuhgh&rtf.au%5B%5D=pokpok" );
    });
});

describe('Record Type extraction', function(){
    it('works for BOOKS', function(){
        expect(r.rtype()).toEqual('BKS');
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
