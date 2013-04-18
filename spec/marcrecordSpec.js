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
                    't', 'xyzzy'
                ]
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
        expect(r.fields('006')).toEqual(
            [['006','98234k2j3h4kj'], ['006','kwjrkwerwerwe']]);
    });
    it('Fetch one field', function() {
        expect(r.field('006')).toBe('98234k2j3h4kj');
    });
    it('Fetch no field', function() {
        expect(r.field('007')).not.toBeDefined();
    });
    it('Fetch fields with regex', function() {
        expect(r.fields('..6')).toEqual(
            [ [ '006', '98234k2j3h4kj' ],
              [ '006', 'kwjrkwerwerwe' ],
              [ '016', { ind1 : '1', ind2 : ' ',
                         subfields : [ 'b', 'zzyzzy', 'b', 'zzxyyx', 't', 'xyzzy' ] } ]
            ]
        );
    });
});

describe('Fetch control fields', function() {
    it('Fetch all positions', function() {
        expect(r.ctrl('006')).toBe('98234k2j3h4kj')
    });
    it('Fetch single position', function() {
        expect(r.ctrl('006[2]')).toBe('2')
    });
    it('Fetch range of positions', function() {
        expect(r.ctrl('006[4-6]')).toBe('4k2')
    });
});

describe('Fetch subfields', function() {
    it('Fetch all subfields', function() {
        expect(r.subfields('040acbdez')).toEqual(
            [ [ '040a', '21234' ], [ '040z', 'sldkflsd' ] ]);
    });
    it('Fetch one subfield', function() {
        expect(r.subfield('040a')).toBe('21234');
    });
    it('Fetch one subfield with regex', function() {
        expect(r.subfield('01.b')).toBe('zzyzzy');
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
