////////////////////////////////////////////////////////////
// TERMINALS & PLANES
////////////////////////////////////////////////////////////

/*!
 * 
 * GAME SETTING CUSTOMIZATION START
 * 
 */

//PLANES
var frameSpeed = 1.5;
var planes_arr = [{
        animation: {
            static: [0, "static", frameSpeed]
        },
        regX: 70,
        regY: 53,
        width: 140,
        height: 92,
        count: 4,
        src: 'assets/plane_big_Spritesheet4x1.png',
        shadowsrc: 'assets/plane_big_shadow_Spritesheet4x1.png',
        planeHeight: 20
    },
    {
        animation: {
            static: [0, "static", frameSpeed]
        },
        regX: 64,
        regY: 45,
        width: 128,
        height: 80,
        count: 4,
        src: 'assets/plane_medium_Spritesheet4x1.png',
        shadowsrc: 'assets/plane_medium_shadow_Spritesheet4x1.png',
        planeHeight: 15
    },
    {
        animation: {
            static: [0, "static", frameSpeed]
        },
        regX: 28,
        regY: 18,
        width: 56,
        height: 40,
        count: 4,
        src: 'assets/plane_small_Spritesheet4x1.png',
        shadowsrc: 'assets/plane_small_shadow_Spritesheet4x1.png',
        planeHeight: 10
    }
];


//TERMINALS
var terminals_arr = [{
        name: 'Terminal 1',
        src: 'assets/terminal_01.png',
        thumb: 'assets/thumb_01.png',
        runway: [{
            landing: [{
                x: 930,
                y: 349
            }, {
                x: 383,
                y: 664
            }, ],
            holding1: [{
                x: 275,
                y: 601
            }, ],
            taxiway1: [{
                x: 172,
                y: 540
            }, {
                x: 430,
                y: 394
            }, ],
            terminalin: [{
                path: [{
                    x: 251,
                    y: 290
                }, {
                    x: 363,
                    y: 219
                }, ]
            }, {
                path: [{
                    x: 354,
                    y: 351
                }, {
                    x: 485,
                    y: 273
                }, ]
            }, ],
            terminalout: [{
                path: [{
                    x: 249,
                    y: 292
                }, {
                    x: 496,
                    y: 434
                }, {
                    x: 666,
                    y: 333
                }, ]
            }, {
                path: [{
                    x: 354,
                    y: 354
                }, {
                    x: 495,
                    y: 434
                }, {
                    x: 667,
                    y: 335
                }, ]
            }, ],
            taxiway2: [{
                x: 696,
                y: 349
            }, ],
            holding2: [{
                x: 813,
                y: 415
            }, ],
            takeoff: [{
                x: 243,
                y: 745
            }, ],
        }, ],
    },

    {
        name: 'Terminal 2',
        src: 'assets/terminal_02.png',
        thumb: 'assets/thumb_02.png',
        runway: [{
            landing: [{
                x: 760,
                y: 758
            }, {
                x: 207,
                y: 434
            }, ],
            holding1: [{
                x: 24,
                y: 331
            }, {
                x: 62,
                y: 307
            }, ],
            taxiway1: [{
                x: 345,
                y: 143
            }, {
                x: 435,
                y: 193
            }, ],
            terminalin: [{
                path: [{
                    x: 485,
                    y: 226
                }, {
                    x: 574,
                    y: 172
                }, ]
            }, {
                path: [{
                    x: 593,
                    y: 286
                }, {
                    x: 701,
                    y: 221
                }, ]
            }, {
                path: [{
                    x: 701,
                    y: 348
                }, {
                    x: 834,
                    y: 271
                }, ]
            }, ],
            terminalout: [{
                path: [{
                    x: 484,
                    y: 225
                }, {
                    x: 787,
                    y: 401
                }, ]
            }, {
                path: [{
                    x: 591,
                    y: 287
                }, {
                    x: 790,
                    y: 399
                }, ]
            }, {
                path: [{
                    x: 698,
                    y: 348
                }, {
                    x: 791,
                    y: 398
                }, ]
            }, ],
            taxiway2: [{
                x: 942,
                y: 489
            }, {
                x: 916,
                y: 507
            }, ],
            holding2: [{
                x: 815,
                y: 568
            }, {
                x: 899,
                y: 614
            }, {
                x: 710,
                y: 729
            }, ],
            takeoff: [{
                x: -7,
                y: 308
            }, ],
        }, {
            landing: [{
                x: 940,
                y: 634
            }, {
                x: 380,
                y: 311
            }, ],
            holding1: [{
                x: 326,
                y: 279
            }, ],
            taxiway1: [{
                x: 216,
                y: 220
            }, {
                x: 343,
                y: 143
            }, {
                x: 432,
                y: 192
            }, ],
            terminalin: [{
                path: [{
                    x: 485,
                    y: 226
                }, {
                    x: 574,
                    y: 172
                }, ]
            }, {
                path: [{
                    x: 593,
                    y: 286
                }, {
                    x: 701,
                    y: 221
                }, ]
            }, {
                path: [{
                    x: 701,
                    y: 348
                }, {
                    x: 834,
                    y: 271
                }, ]
            }, ],
            terminalout: [{
                path: [{
                    x: 484,
                    y: 225
                }, {
                    x: 787,
                    y: 401
                }, ]
            }, {
                path: [{
                    x: 591,
                    y: 287
                }, {
                    x: 790,
                    y: 399
                }, ]
            }, {
                path: [{
                    x: 698,
                    y: 348
                }, {
                    x: 791,
                    y: 398
                }, ]
            }, ],
            taxiway2: [{
                x: 944,
                y: 495
            }, {
                x: 919,
                y: 508
            }, ],
            holding2: [{
                x: 816,
                y: 562
            }, ],
            takeoff: [{
                x: 85,
                y: 144
            }, ],
        }, ],
    },

    {
        name: 'Terminal 3',
        src: 'assets/terminal_03.png',
        thumb: 'assets/thumb_03.png',
        runway: [{
            landing: [{
                x: 853,
                y: 326
            }, {
                x: 361,
                y: 607
            }, ],
            holding1: [{
                x: 259,
                y: 666
            }, {
                x: 62,
                y: 550
            }, {
                x: 79,
                y: 542
            }, ],
            taxiway1: [{
                x: 288,
                y: 419
            }, ],
            terminalin: [{
                path: [{
                    x: 358,
                    y: 379
                }, {
                    x: 233,
                    y: 304
                }, ]
            }, {
                path: [{
                    x: 466,
                    y: 315
                }, {
                    x: 336,
                    y: 242
                }, ]
            }, {
                path: [{
                    x: 567,
                    y: 255
                }, {
                    x: 464,
                    y: 190
                }, ]
            }, {
                path: [{
                    x: 678,
                    y: 192
                }, {
                    x: 589,
                    y: 143
                }, ]
            }, ],
            terminalout: [{
                path: [{
                    x: 357,
                    y: 379
                }, {
                    x: 727,
                    y: 164
                }, ]
            }, {
                path: [{
                    x: 468,
                    y: 314
                }, {
                    x: 725,
                    y: 168
                }, ]
            }, {
                path: [{
                    x: 571,
                    y: 255
                }, {
                    x: 722,
                    y: 167
                }, ]
            }, {
                path: [{
                    x: 680,
                    y: 192
                }, {
                    x: 728,
                    y: 166
                }, ]
            }, ],
            taxiway2: [{
                x: 841,
                y: 102
            }, {
                x: 943,
                y: 162
            }, {
                x: 900,
                y: 187
            }, ],
            holding2: [{
                x: 789,
                y: 256
            }, {
                x: 878,
                y: 311
            }, {
                x: 794,
                y: 359
            }, ],
            takeoff: [{
                x: 97,
                y: 759
            }, ],
        }, {
            landing: [{
                x: 960,
                y: 389
            }, {
                x: 459,
                y: 674
            }, ],
            holding1: [{
                x: 366,
                y: 730
            }, {
                x: 167,
                y: 612
            }, {
                x: 274,
                y: 552
            }, {
                x: 257,
                y: 543
            }, ],
            taxiway1: [{
                x: 171,
                y: 487
            }, {
                x: 298,
                y: 416
            }, ],
            terminalin: [{
                path: [{
                    x: 358,
                    y: 379
                }, {
                    x: 233,
                    y: 304
                }, ]
            }, {
                path: [{
                    x: 466,
                    y: 315
                }, {
                    x: 336,
                    y: 242
                }, ]
            }, {
                path: [{
                    x: 567,
                    y: 255
                }, {
                    x: 464,
                    y: 190
                }, ]
            }, {
                path: [{
                    x: 678,
                    y: 192
                }, {
                    x: 589,
                    y: 143
                }, ]
            }, ],
            terminalout: [{
                path: [{
                    x: 357,
                    y: 379
                }, {
                    x: 727,
                    y: 164
                }, ]
            }, {
                path: [{
                    x: 468,
                    y: 314
                }, {
                    x: 725,
                    y: 168
                }, ]
            }, {
                path: [{
                    x: 571,
                    y: 255
                }, {
                    x: 722,
                    y: 167
                }, ]
            }, {
                path: [{
                    x: 680,
                    y: 192
                }, {
                    x: 728,
                    y: 166
                }, ]
            }, ],
            taxiway2: [{
                x: 839,
                y: 101
            }, {
                x: 945,
                y: 163
            }, {
                x: 900,
                y: 189
            }, ],
            holding2: [{
                x: 788,
                y: 259
            }, {
                x: 989,
                y: 369
            }, {
                x: 892,
                y: 425
            }, ],
            takeoff: [{
                x: 306,
                y: 761
            }, ],
        }, ],
    },

];