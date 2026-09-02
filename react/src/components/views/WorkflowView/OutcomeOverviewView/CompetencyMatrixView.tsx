import { useTranslation } from 'react-i18next'

const CompetencyMatrixView = () => {
  const { t } = useTranslation('workflow')
  return <>{t('unavailableView')}</>
}

export default CompetencyMatrixView
