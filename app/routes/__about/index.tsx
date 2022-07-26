import {
    Box,
    Button,
    Container,
    createStyles,
    Text,
    Title,
} from '@mantine/core'
import { Dots } from 'tabler-icons-react'
import { NavLink } from '@remix-run/react'

const useStyles = createStyles((theme) => ({
    wrapper: {
        position: 'relative',
        paddingTop: 120,
        paddingBottom: 80,

        '@media (max-width: 755px)': {
            paddingTop: 80,
            paddingBottom: 60,
        },
    },

    inner: {
        position: 'relative',
        zIndex: 1,
    },

    dots: {
        position: 'absolute',
        color:
            theme.colorScheme === 'dark'
                ? theme.colors.dark[5]
                : theme.colors.gray[1],

        '@media (max-width: 755px)': {
            display: 'none',
        },
    },

    dotsLeft: {
        left: 0,
        top: 0,
    },

    title: {
        textAlign: 'center',
        fontWeight: 800,
        fontSize: 40,
        letterSpacing: -1,
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
        marginBottom: theme.spacing.xs,
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,

        '@media (max-width: 520px)': {
            fontSize: 28,
            textAlign: 'left',
        },
    },

    highlight: {
        color: theme.colors[theme.primaryColor][
            theme.colorScheme === 'dark' ? 4 : 6
        ],
    },

    description: {
        textAlign: 'center',

        '@media (max-width: 520px)': {
            textAlign: 'left',
            fontSize: theme.fontSizes.md,
        },
    },

    controls: {
        marginTop: theme.spacing.lg,
        display: 'flex',
        justifyContent: 'center',

        '@media (max-width: 520px)': {
            flexDirection: 'column',
        },
    },

    control: {
        '&:not(:first-of-type)': {
            marginLeft: theme.spacing.md,
        },

        '@media (max-width: 520px)': {
            height: 42,
            fontSize: theme.fontSizes.md,

            '&:not(:first-of-type)': {
                marginTop: theme.spacing.md,
                marginLeft: 0,
            },
        },
    },
}))

export default function LandingPage() {
    const { classes } = useStyles()

    return (
        <Container className={classes.wrapper} size={1400}>
            <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
            <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
            <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
            <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

            <div className={classes.inner}>
                <Title className={classes.title}>
                    Intuitive{' '}
                    <Text
                        component={'span'}
                        className={classes.highlight}
                        inherit
                    >
                        cash flow
                    </Text>{' '}
                    for everyone
                </Title>

                <Container p={0} size={600}>
                    <Text
                        size={'lg'}
                        color={'dimmed'}
                        className={classes.description}
                    >
                        Build more reliable tracking with Monneh. Get visibility
                        into your organizations spending.
                    </Text>
                </Container>

                <div className={classes.controls}>
                    <Button
                        component={NavLink}
                        to={'/'}
                        className={classes.control}
                        size={'lg'}
                        variant={'default'}
                        color={'gray'}
                    >
                        Find out more
                    </Button>
                    <Button
                        component={NavLink}
                        to={'/login'}
                        className={classes.control}
                        size={'lg'}
                    >
                        Get started
                    </Button>
                </div>
            </div>
        </Container>
    )
}
