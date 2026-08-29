import { DailyScripture } from '../types.ts';
import { SupportedLanguage } from '../translations/types.ts';

interface MultilingualScripture {
  en: DailyScripture;
  hy: DailyScripture;
  ru: DailyScripture;
  hi: DailyScripture;
  pa: DailyScripture;
}

export const SCRIPTURES_DATA: MultilingualScripture[] = [
  {
    en: {
      text: "Go, therefore, and make disciples of people of all the nations, baptizing them in the name of the Father and of the Son and of the holy spirit, teaching them to observe all the things I have commanded you.",
      reference: "Matthew 28:19, 20",
      theme: "The Great Commission"
    },
    hy: {
      text: "Ուրեմն գնացեք և բոլոր ազգերի մեջ աշակերտներ պատրաստեք՝ մկրտելով նրանց Հոր, Որդու և սուրբ ոգու անունով, սովորեցնելով նրանց պահել այն ամենը, ինչ պատվիրեցի ձեզ:",
      reference: "Մատթեոս 28:19, 20",
      theme: "Մեծ հանձնարարությունը"
    },
    ru: {
      text: "Поэтому идите и подготавливайте учеников во всех народах, крестя их во имя Отца, Сына и святого духа и уча их соблюдать всё, что я вам повелел.",
      reference: "Матфея 28:19, 20",
      theme: "Великое поручение"
    },
    hi: {
      text: "इसलिए तुम जाकर सब जातियों के लोगों को चेला बनाओ और उन्हें पिता, पुत्र और पवित्र आत्मा के नाम से बपतिस्मा दो और उन्हें वे सब बातें मानना सिखाओ जिनकी मैंने तुम्हें आज्ञा दी है।",
      reference: "मत्ती 28:19, 20",
      theme: "महान आज्ञा"
    },
    pa: {
      text: "ਇਸ ਲਈ ਤੁਸੀਂ ਜਾ ਕੇ ਸਾਰੀਆਂ ਕੌਮਾਂ ਦੇ ਲੋਕਾਂ ਨੂੰ ਚੇਲੇ ਬਣਾਓ, ਉਨ੍ਹਾਂ ਨੂੰ ਪਿਤਾ, ਪੁੱਤਰ ਅਤੇ ਪਵਿੱਤਰ ਸ਼ਕਤੀ ਦੇ ਨਾਂ ਤੇ ਬਪਤਿਸਮਾ ਦਿਓ, ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਉਹ ਸਾਰੀਆਂ ਗੱਲਾਂ ਮੰਨਣੀਆਂ ਸਿਖਾਓ ਜਿਨ੍ਹਾਂ ਦਾ ਮੈਂ ਤੁਹਾਨੂੰ ਹੁਕਮ ਦਿੱਤਾ ਹੈ।",
      reference: "ਮੱਤੀ 28:19, 20",
      theme: "ਮਹਾਨ ਆਗਿਆ"
    }
  },
  {
    en: {
      text: "And this good news of the Kingdom will be preached in all the inhabited earth for a witness to all the nations, and then the end will come.",
      reference: "Matthew 24:14",
      theme: "Preaching the Good News"
    },
    hy: {
      text: "Թագավորության այս բարի լուրը կքարոզվի ամբողջ երկրով մեկ՝ ի վկայություն բոլոր ազգերին, և այդ ժամանակ կգա վերջը:",
      reference: "Մատթեոս 24:14",
      theme: "Բարի լուրի քարոզչությունը"
    },
    ru: {
      text: "Эта благая весть о Царстве будет проповедана по всей земле для свидетельства всем народам, и тогда придёт конец.",
      reference: "Матфея 24:14",
      theme: "Проповедь благой вести"
    },
    hi: {
      text: "और राज की इस खुशखबरी का सारे जगत में प्रचार किया जाएगा ताकि सब जातियों को गवाही मिले, और तब अंत आएगा।",
      reference: "मत्ती 24:14",
      theme: "खुशखबरी का प्रचार"
    },
    pa: {
      text: "ਅਤੇ ਰਾਜ ਦੀ ਇਸ ਖ਼ੁਸ਼ ਖ਼ਬਰੀ ਦਾ ਪ੍ਰਚਾਰ ਸਾਰੀ ਦੁਨੀਆਂ ਵਿਚ ਕੀਤਾ ਜਾਵੇਗਾ ਤਾਂਕਿ ਸਾਰੀਆਂ ਕੌਮਾਂ ਨੂੰ ਗਵਾਹੀ ਮਿਲੇ, ਅਤੇ ਫਿਰ ਅੰਤ ਆਵੇਗਾ।",
      reference: "ਮੱਤੀ 24:14",
      theme: "ਖ਼ੁਸ਼ ਖ਼ਬਰੀ ਦਾ ਪ੍ਰਚਾਰ"
    }
  },
  {
    en: {
      text: "How beautiful on the mountains are the feet of the one who brings good news, the one who proclaims peace, the one who brings good news of something better, the one who proclaims salvation.",
      reference: "Isaiah 52:7",
      theme: "Bringing Good News"
    },
    hy: {
      text: "Որքա՜ն գեղեցիկ են լեռների վրա բարի լուր բերողի ոտքերը, նրա, ով խաղաղություն է հռչակում, ով ավելի լավ բանի բարի լուր է բերում, ով փրկություն է հռչակում:",
      reference: "Եսայիա 52:7",
      theme: "Բարի լուր բերողը"
    },
    ru: {
      text: "Как прекрасны на горах ноги несущего благую весть, возвещающего мир, несущего добрую весть о лучшем, возвещающего спасение.",
      reference: "Исаия 52:7",
      theme: "Вестники благой вести"
    },
    hi: {
      text: "पहाड़ों पर उसके पाँव क्या ही सुहावने हैं जो खुशखबरी लाता है, जो शांति का संदेश सुनाता है, जो भलाई की खुशखबरी लाता है और उद्धार का प्रचार करता है।",
      reference: "यशायाह 52:7",
      theme: "खुशखबरी लाने वाले"
    },
    pa: {
      text: "ਪਹਾੜਾਂ ਉੱਤੇ ਉਸ ਦੇ ਪੈਰ ਕਿੰਨੇ ਸੋਹਣੇ ਹਨ ਜੋ ਖ਼ੁਸ਼ ਖ਼ਬਰੀ ਲਿਆਉਂਦਾ ਹੈ, ਜੋ ਸ਼ਾਂਤੀ ਦਾ ਐਲਾਨ ਕਰਦਾ ਹੈ, ਜੋ ਭਲਾਈ ਦੀ ਖ਼ੁਸ਼ ਖ਼ਬਰੀ ਲਿਆਉਂਦਾ ਹੈ ਅਤੇ ਮੁਕਤੀ ਦਾ ਪ੍ਰਚਾਰ ਕਰਦਾ ਹੈ।",
      reference: "ਯਸਾਯਾਹ 52:7",
      theme: "ਖ਼ੁਸ਼ ਖ਼ਬਰੀ ਲਿਆਉਣ ਵਾਲੇ"
    }
  },
  {
    en: {
      text: "For God is not unrighteous so as to forget your work and the love you showed for his name, in that you have ministered and continue to minister to the holy ones.",
      reference: "Hebrews 6:10",
      theme: "Jehovah Remembers Your Work"
    },
    hy: {
      text: "Աստված անարդար չէ, որ մոռանա ձեր գործերը և այն սերը, որ դուք ցույց տվեցիք նրա անվան հանդեպ:",
      reference: "Եբրայեցիներ 6:10",
      theme: "Եհովան չի մոռանում ձեր աշխատանքը"
    },
    ru: {
      text: "Ведь Бог не неправеден, чтобы забыть ваш труд и любовь, которую вы проявили к его имени.",
      reference: "Евреям 6:10",
      theme: "Иегова помнит ваш труд"
    },
    hi: {
      text: "क्योंकि परमेश्वर अन्यायी नहीं है कि तुम्हारे काम और उस प्रेम को भूल जाए जो तुमने उसके नाम के लिए दिखाया है।",
      reference: "इब्रानियों 6:10",
      theme: "यहोवा आपके काम को याद रखता है"
    },
    pa: {
      text: "ਕਿਉਂਕਿ ਪਰਮੇਸ਼ੁਰ ਅਣਧਰਮੀ ਨਹੀਂ ਹੈ ਕਿ ਤੁਹਾਡੇ ਕੰਮ ਅਤੇ ਉਸ ਪਿਆਰ ਨੂੰ ਭੁੱਲ ਜਾਵੇ ਜੋ ਤੁਸੀਂ ਉਸ ਦੇ ਨਾਂ ਲਈ ਦਿਖਾਇਆ ਹੈ।",
      reference: "ਇਬਰਾਨੀਆਂ 6:10",
      theme: "ਯਹੋਵਾਹ ਤੁਹਾਡੇ ਕੰਮ ਨੂੰ ਯਾਦ ਰੱਖਦਾ ਹੈ"
    }
  },
  {
    en: {
      text: "Therefore, my beloved brothers, be steadfast, immovable, always having plenty to do in the work of the Lord, knowing that your labor is not in vain in connection with the Lord.",
      reference: "1 Corinthians 15:58",
      theme: "Labor Not in Vain"
    },
    hy: {
      text: "Ուրեմն, իմ սիրելի եղբայրներ, հաստատուն եղեք, անսասան, միշտ շատ աշխատեք Տիրոջ գործում՝ իմանալով, որ ձեր աշխատանքը Տիրոջ մեջ իզուր չէ:",
      reference: "1 Կորնթացիներ 15:58",
      theme: "Աշխատանքը իզուր չէ"
    },
    ru: {
      text: "Поэтому, мои дорогие братья, будьте тверды, непоколебимы, всегда много трудитесь в деле Господа, зная, что ваш труд не напрасен перед Господом.",
      reference: "1 Коринфянам 15:58",
      theme: "Труд не напрасен"
    },
    hi: {
      text: "इसलिए मेरे प्यारे भाइयो, दृढ़ और अटल बने रहो और प्रभु के काम में हमेशा लगे रहो, क्योंकि तुम जानते हो कि प्रभु में तुम्हारा परिश्रम व्यर्थ नहीं है।",
      reference: "1 कुरिंथियों 15:58",
      theme: "परिश्रम व्यर्थ नहीं"
    },
    pa: {
      text: "ਇਸ ਲਈ ਮੇਰੇ ਪਿਆਰੇ ਭਰਾਵੋ, ਕਾਇਮ ਅਤੇ ਅਟੱਲ ਰਹੋ, ਅਤੇ ਪ੍ਰਭੂ ਦੇ ਕੰਮ ਵਿਚ ਹਮੇਸ਼ਾ ਰੁੱਝੇ ਰਹੋ, ਇਹ ਜਾਣਦੇ ਹੋਏ ਕਿ ਪ੍ਰਭੂ ਵਿਚ ਤੁਹਾਡੀ ਮਿਹਨਤ ਅਜਾਈਂ ਨਹੀਂ ਹੈ।",
      reference: "1 ਕੁਰਿੰਥੀਆਂ 15:58",
      theme: "ਮਿਹਨਤ ਅਜਾਈਂ ਨਹੀਂ"
    }
  },
  {
    en: {
      text: "So let us not give up in doing what is fine, for in due time we will reap if we do not tire out.",
      reference: "Galatians 6:9",
      theme: "Endurance in Ministry"
    },
    hy: {
      text: "Եկեք չհոգնենք բարի գործեր անելուց, որովհետև ճիշտ ժամանակին կհնձենք, եթե չթուլանանք:",
      reference: "Գաղատացիներ 6:9",
      theme: "Տոկունություն ծառայության մեջ"
    },
    ru: {
      text: "Не будем же опускать руки, делая добро, потому что в своё время пожнём, если не ослабеем.",
      reference: "Галатам 6:9",
      theme: "Стойкость в служении"
    },
    hi: {
      text: "इसलिए हम भला काम करने में हिम्मत न हारें, क्योंकि यदि हम थके नहीं तो ठीक समय पर कटनी काटेंगे।",
      reference: "गलातियों 6:9",
      theme: "सेवकाई में धीरज"
    },
    pa: {
      text: "ਇਸ ਲਈ ਅਸੀਂ ਭਲਾ ਕੰਮ ਕਰਨ ਵਿਚ ਹਿੰਮਤ ਨਾ ਹਾਰੀਏ, ਕਿਉਂਕਿ ਜੇ ਅਸੀਂ ਹੌਸਲਾ ਨਾ ਛੱਡੀਏ, ਤਾਂ ਸਹੀ ਸਮੇਂ ਤੇ ਵਾਢੀ ਵੱਢਾਂਗੇ।",
      reference: "ਗਲਾਤੀਆਂ 6:9",
      theme: "ਸੇਵਕਾਈ ਵਿਚ ਧੀਰਜ"
    }
  },
  {
    en: {
      text: "Trust in Jehovah with all your heart, and do not rely on your own understanding. In all your ways take notice of him, and he will make your paths straight.",
      reference: "Proverbs 3:5, 6",
      theme: "Trust in Jehovah"
    },
    hy: {
      text: "Ամբողջ սրտովդ ապավինիր Եհովային և քո սեփական հասկացողությանը մի՛ վստահիր: Քո բոլոր ճանապարհներում նկատի ունեցիր նրան, և նա կուղղի քո շավիղները:",
      reference: "Առակներ 3:5, 6",
      theme: "Ապավինեք Եհովային"
    },
    ru: {
      text: "Полагайся на Иегову всем сердцем и не надейся на своё понимание. Помни о нём на всех своих путях, и он сделает твои пути прямыми.",
      reference: "Притчи 3:5, 6",
      theme: "Доверие к Иегове"
    },
    hi: {
      text: "तू अपनी सारी समझ का सहारा न लेना, वरन संपूर्ण मन से यहोवा पर भरोसा रखना। अपने सब मार्गों में उसी को स्मरण रखना, और वह तेरे लिए सीधा मार्ग निकालेगा।",
      reference: "नीतिवचन 3:5, 6",
      theme: "यहोवा पर भरोसा"
    },
    pa: {
      text: "ਤੂੰ ਆਪਣੇ ਪੂਰੇ ਦਿਲ ਨਾਲ ਯਹੋਵਾਹ ਉੱਤੇ ਭਰੋਸਾ ਰੱਖ ਅਤੇ ਆਪਣੀ ਹੀ ਸਮਝ ਦਾ ਸਹਾਰਾ ਨਾ ਲੈ। ਆਪਣੇ ਸਾਰੇ ਰਾਹਾਂ ਵਿਚ ਉਸ ਨੂੰ ਯਾਦ ਰੱਖ, ਅਤੇ ਉਹ ਤੇਰੇ ਰਾਹਾਂ ਨੂੰ ਸਿੱਧਾ ਕਰੇਗਾ।",
      reference: "ਕਹਾਉਤਾਂ 3:5, 6",
      theme: "ਯਹੋਵਾਹ ਉੱਤੇ ਭਰੋਸਾ"
    }
  },
  {
    en: {
      text: "Preach the word; be at it urgently in favorable times and difficult times; reprove, reprimand, exhort, with all patience and art of teaching.",
      reference: "2 Timothy 4:2",
      theme: "Urgency in Preaching"
    },
    hy: {
      text: "Քարոզիր խոսքը, արա դա հրատապությամբ՝ բարենպաստ և դժվար ժամանակներում, հանդիմանիր, սաստիր, հորդորիր ամենայն համբերատարությամբ և ուսուցանելու արվեստով:",
      reference: "2 Տիմոթեոս 4:2",
      theme: "Հրատապություն քարոզչության մեջ"
    },
    ru: {
      text: "Проповедуй слово, делай это безотлагательно и в благоприятное время, и в неблагоприятное, обличай, предостерегай, увещай со всем долготерпением и искусством учить.",
      reference: "2 Тимофею 4:2",
      theme: "Безотлагательность проповеди"
    },
    hi: {
      text: "तू वचन का प्रचार कर, चाहे समय अनुकूल हो या प्रतिकूल, तत्पर रह; सब प्रकार के धीरज और शिक्षा के साथ समझा, डांट और उत्साहित कर।",
      reference: "2 तीमुथियुस 4:2",
      theme: "प्रचार में तत्परता"
    },
    pa: {
      text: "ਤੂੰ ਬਚਨ ਦਾ ਪ੍ਰਚਾਰ ਕਰ, ਚਾਹੇ ਸਮਾਂ ਢੁਕਵਾਂ ਹੋਵੇ ਜਾਂ ਨਾ, ਤਿਆਰ ਰਹਿ; ਪੂਰੇ ਧੀਰਜ ਅਤੇ ਸਿਖਾਉਣ ਦੀ ਕਲਾ ਨਾਲ ਸਮਝਾ, ਤਾੜਨਾ ਕਰ ਅਤੇ ਹੌਸਲਾ ਦੇ।",
      reference: "2 ਤਿਮੋਥਿਉਸ 4:2",
      theme: "ਪ੍ਰਚਾਰ ਵਿਚ ਤਤਪਰਤਾ"
    }
  },
  {
    en: {
      text: "Do not be afraid, for I am with you. Do not be anxious, for I am your God. I will fortify you, yes, I will help you, I will really hold on to you with my right hand of righteousness.",
      reference: "Isaiah 41:10",
      theme: "Divine Support"
    },
    hy: {
      text: "Մի՛ վախեցիր, որովհետև ես քեզ հետ եմ: Մի՛ անհանգստացիր, որովհետև ես քո Աստվածն եմ: Ես կզորացնեմ քեզ, այո՛, ես կօգնեմ քեզ, արդարության աջ ձեռքով ամուր կբռնեմ քեզ:",
      reference: "Եսայիա 41:10",
      theme: "Աստվածային զորակցություն"
    },
    ru: {
      text: "Не бойся, потому что я с тобой. Не тревожься, потому что я твой Бог. Я укреплю тебя, помогу тебе, буду крепко держать тебя правой рукой праведности.",
      reference: "Исаия 41:10",
      theme: "Божья поддержка"
    },
    hi: {
      text: "मत डर, क्योंकि मैं तेरे संग हूँ; निराश मत हो, क्योंकि मैं तेरा परमेश्वर हूँ; मैं तुझे दृढ़ करूंगा और तेरी सहायता करूंगा; अपने धर्ममय दाहिने हाथ से तुझे संभाले रहूंगा।",
      reference: "यशायाह 41:10",
      theme: "ईश्वरीय सहायता"
    },
    pa: {
      text: "ਤੂੰ ਨਾ ਡਰ, ਕਿਉਂਕਿ ਮੈਂ ਤੇਰੇ ਨਾਲ ਹਾਂ; ਘਬਰਾ ਨਾ, ਕਿਉਂਕਿ ਮੈਂ ਤੇਰਾ ਪਰਮੇਸ਼ੁਰ ਹਾਂ। ਮੈਂ ਤੈਨੂੰ ਬਲ ਬਖ਼ਸ਼ਾਂਗਾ, ਹਾਂ, ਮੈਂ ਤੇਰੀ ਮਦਦ ਕਰਾਂਗਾ, ਮੈਂ ਆਪਣੇ ਧਰਮ ਦੇ ਸੱਜੇ ਹੱਥ ਨਾਲ ਤੈਨੂੰ ਸੰਭਾਲਾਂਗਾ।",
      reference: "ਯਸਾਯਾਹ 41:10",
      theme: "ਰੱਬੀ ਮਦਦ"
    }
  },
  {
    en: {
      text: "For we are God's fellow workers. You are God's field under cultivation, God's building.",
      reference: "1 Corinthians 3:9",
      theme: "Fellow Workers"
    },
    hy: {
      text: "Որովհետև մենք Աստծու համագործակիցներն ենք: Դուք Աստծու մշակվող դաշտն եք, Աստծու կառույցը:",
      reference: "1 Կորնթացիներ 3:9",
      theme: "Համագործակիցներ Աստծու հետ"
    },
    ru: {
      text: "Ведь мы — сотрудники Бога, а вы — Божья возделываемая нива, Божье строение.",
      reference: "1 Коринфянам 3:9",
      theme: "Сотрудники Бога"
    },
    hi: {
      text: "क्योंकि हम परमेश्वर के सहकर्मी हैं; तुम परमेश्वर की खेती और परमेश्वर की रचना हो।",
      reference: "1 कुरिंथियों 3:9",
      theme: "परमेश्वर के सहकर्मी"
    },
    pa: {
      text: "ਕਿਉਂਕਿ ਅਸੀਂ ਪਰਮੇਸ਼ੁਰ ਦੇ ਸਹਿਕਰਮੀ ਹਾਂ; ਤੁਸੀਂ ਪਰਮੇਸ਼ੁਰ ਦੀ ਖੇਤੀ ਅਤੇ ਪਰਮੇਸ਼ੁਰ ਦੀ ਇਮਾਰਤ ਹੋ।",
      reference: "1 ਕੁਰਿੰਥੀਆਂ 3:9",
      theme: "ਪਰਮੇਸ਼ੁਰ ਦੇ ਸਹਿਕਰਮੀ"
    }
  }
];

export function getDailyScripture(date: Date = new Date(), lang: SupportedLanguage = 'en'): DailyScripture {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % SCRIPTURES_DATA.length;
  const item = SCRIPTURES_DATA[index];
  return item[lang] || item.en;
}
