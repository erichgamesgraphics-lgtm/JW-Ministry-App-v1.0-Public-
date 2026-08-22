package com.example.data.repository

import com.example.data.model.DailyScripture
import java.util.Calendar

class ScriptureRepository {
    private val scriptures = listOf(
        DailyScripture(1, "Matthew 28:19, 20", "Go, therefore, and make disciples of people of all the nations, baptizing them in the name of the Father and of the Son and of the holy spirit.", "Preaching Commission"),
        DailyScripture(2, "Matthew 24:14", "And this good news of the Kingdom will be preached in all the inhabited earth for a witness to all the nations, and then the end will come.", "Kingdom Good News"),
        DailyScripture(3, "Romans 10:13, 14", "For 'everyone who calls on the name of Jehovah will be saved.' However, how will they call on him if they have not put faith in him? And how will they hear without someone to preach?", "Spreading the Name"),
        DailyScripture(4, "Isaiah 6:8", "Then I heard the voice of Jehovah saying: 'Whom shall I send, and who will go for us?' And I said: 'Here I am! Send me!'", "Willing Spirit"),
        DailyScripture(5, "2 Timothy 4:2", "Preach the word; be at it urgently in favorable times and difficult times.", "Urgency"),
        DailyScripture(6, "Acts 20:20", "I did not hold back from telling you any of the things that were profitable nor from teaching you publicly and from house to house.", "House-to-House"),
        DailyScripture(7, "Galatians 6:9", "So let us not give up in doing what is fine, for in due time we will reap if we do not tire out.", "Endurance"),
        DailyScripture(8, "1 Corinthians 3:6", "I planted, Apollos watered, but God kept making it grow.", "God's Growth"),
        DailyScripture(9, "Psalm 126:5, 6", "Those sowing seed with tears will reap with a joyful cry.", "Reaping with Joy"),
        DailyScripture(10, "Colossians 4:6", "Let your words always be gracious, seasoned with salt, so that you will know how you should answer each person.", "Gracious Speech"),
        DailyScripture(11, "1 Peter 3:15", "Always be ready to make a defense before everyone who demands of you a reason for the hope you have, doing so with a mild temper and deep respect.", "Mild Temper"),
        DailyScripture(12, "Proverbs 3:5, 6", "Trust in Jehovah with all your heart, and do not rely on your own understanding. In all your ways take notice of him, and he will make your paths straight.", "Trust in Jehovah"),
        DailyScripture(13, "Isaiah 40:29", "He gives power to the tired one and full might to those lacking strength.", "Divine Strength"),
        DailyScripture(14, "Joshua 1:9", "Be courageous and strong. Do not be struck with terror or fear, for Jehovah your God is with you wherever you go.", "Courage in Preaching"),
        DailyScripture(15, "Philippians 4:13", "For all things I have the strength through the one who gives me power.", "Strength Through Faith"),
        DailyScripture(16, "Hebrews 6:10", "For God is not unrighteous so as to forget your work and the love you showed for his name.", "God Remembers Your Work"),
        DailyScripture(17, "Acts 1:8", "You will receive power when the holy spirit comes upon you, and you will be witnesses of me... to the most distant part of the earth.", "Holy Spirit Power"),
        DailyScripture(18, "Luke 10:2", "The harvest is great, but the workers are few. Therefore, beg the Master of the harvest to send out workers into his harvest.", "Harvest Workers"),
        DailyScripture(19, "Romans 1:16", "For I am not ashamed of the good news; it is, in fact, God’s power for salvation to everyone having faith.", "Unashamed of Truth"),
        DailyScripture(20, "Psalm 34:8", "Taste and see that Jehovah is good; happy is the man who takes refuge in him.", "Taste and See"),
        DailyScripture(21, "Romans 12:11", "Be industrious, not lazy. Be aglow with the spirit. Slave for Jehovah.", "Zeal for Service"),
        DailyScripture(22, "1 Thessalonians 2:8", "Having tender affection for you, we were determined to impart to you, not only the good news of God but also our very selves.", "Tender Love"),
        DailyScripture(23, "Ecclesiastes 11:6", "Sow your seed in the morning and do not let your hand rest until the evening; for you do not know which will have success.", "Sowing the Seed"),
        DailyScripture(24, "James 1:22", "Become doers of the word and not hearers only.", "Active Doers"),
        DailyScripture(25, "Psalm 119:105", "Your word is a lamp to my foot, and a light for my path.", "Guidance of Truth"),
        DailyScripture(26, "2 Timothy 3:16, 17", "All Scripture is inspired of God and beneficial for teaching, for reproving, for setting things straight.", "Inspired Scripture"),
        DailyScripture(27, "Acts 4:20", "As for us, we cannot stop speaking about the things we have seen and heard.", "Bold Witness"),
        DailyScripture(28, "Hebrews 10:24, 25", "Let us consider one another so as to incite to love and fine works, not forsaking our meeting together.", "Encouragement"),
        DailyScripture(29, "Proverbs 27:11", "Be wise, my son, and make my heart rejoice, so that I can make a reply to him who taunts me.", "Rejoicing Jehovah's Heart"),
        DailyScripture(30, "Psalm 145:11, 12", "They will speak about the glory of your kingship and tell of your mightiness, to make known to men your mighty acts.", "Glorious Kingship"),
        DailyScripture(31, "Zechariah 4:6", "'Not by a military force, nor by power, but by my spirit,' says Jehovah of armies.", "By God's Spirit")
    )

    fun getScriptureForDate(calendar: Calendar = Calendar.getInstance()): DailyScripture {
        val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
        val index = (dayOfYear - 1) % scriptures.size
        return scriptures[index]
    }
}
