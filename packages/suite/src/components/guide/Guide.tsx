import { useState } from 'react';

import styled, { useTheme } from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { spacingsPx, typography, zIndices } from '@trezor/theme';
import { Column, Divider, Icon } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { setView } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    GuideHeader,
    GuideContent,
    GuideViewWrapper,
    GuideCategories,
    GuideSearch,
} from 'src/components/guide';

const FeedbackLinkWrapper = styled.div`
    padding: ${spacingsPx.md};
`;

const FeedbackButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    padding: 11px;
    background: none;
    transition: ${({ theme }) =>
        `background ${theme.legacy.HOVER_TRANSITION_TIME} ${theme.legacy.HOVER_TRANSITION_EFFECT}`};

    /* speficy position and z-index so that GuideButton does not interfere */
    position: relative;
    z-index: ${zIndices.guide};

    &:hover,
    &:focus {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
    }

    &:last-child {
        left: auto;
    }
`;

const FeedbackButtonLabel = styled.div`
    padding: 0 9px;
    ${typography.body}
    width: 100%;
    white-space: nowrap;
`;

const FeedbackIconWrapper = styled.div`
    position: relative;
    top: -1px;
`;

export const Guide = () => {
    const theme = useTheme();
    const [searchActive, setSearchActive] = useState(false);
    const indexNode = useSelector(state => state.guide.indexNode);
    const dispatch = useDispatch();

    const handleFeedbackButtonClick = () => {
        dispatch(setView('SUPPORT_FEEDBACK_SELECTION'));
        analytics.report({
            type: EventType.GuideFeedbackNavigation,
            payload: { type: 'overview' },
        });
    };

    return (
        <GuideViewWrapper>
            <GuideHeader label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />} />
            <Column justifyContent="space-between" alignItems="stretch" height="100%">
                <GuideContent>
                    <GuideSearch pageRoot={indexNode} setSearchActive={setSearchActive} />
                    {!searchActive && <GuideCategories node={indexNode} />}
                </GuideContent>

                <div>
                    <Divider margin={{ bottom: 0, top: 0 }} />
                    <FeedbackLinkWrapper>
                        <FeedbackButton
                            data-testid="@guide/button-feedback"
                            onClick={handleFeedbackButtonClick}
                        >
                            <Icon name="users" size={24} color={theme.iconOnTertiary} />
                            <FeedbackButtonLabel>
                                <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
                            </FeedbackButtonLabel>
                            <FeedbackIconWrapper>
                                <Icon
                                    name="circleRight"
                                    size={24}
                                    color={theme.iconPrimaryDefault}
                                />
                            </FeedbackIconWrapper>
                        </FeedbackButton>
                    </FeedbackLinkWrapper>
                </div>
            </Column>
        </GuideViewWrapper>
    );
};
