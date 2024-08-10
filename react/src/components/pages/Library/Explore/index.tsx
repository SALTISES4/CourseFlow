import * as React from 'react'
import { useRef, useEffect, useState } from 'react'
import ExploreFilter from '@cfCommonComponents/workflow/filters/ExploreFilter'
import { getLibraryQuery } from '@XMLHTTP/API/menu'
import { useQuery } from '@tanstack/react-query'
import { ExploreQueryResp } from '@XMLHTTP/types/query'
import { fetchExploreContext } from '@XMLHTTP/API/pages'
import Loader from '@cfCommonComponents/UIComponents/Loader'

const ExplorePage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [projectData, setProjectData] = useState<{ data_package: any } | null>(
    null
  ) // Specify the type if known
  const createDiv = useRef<HTMLDivElement>(null)

  const { data, error, isLoading, isError } = useQuery<ExploreQueryResp>({
    queryKey: ['fetchExploreContext'],
    queryFn: fetchExploreContext
  })

  useEffect(() => {
    getLibraryQuery((data: { data_package: any }) => {
      // Adjust the type of `data_package` if its structure is known
      // ??
      setProjectData(data)
    })
    if (createDiv.current) {
      COURSEFLOW_APP.makeDropdown(createDiv.current)
    }
    // COURSEFLOW_APP.makeDropdown(this.createDiv.current) // @todo double check in git history these were both correct
  }, [])

  /*******************************************************
   * RENDER
   *******************************************************/
  if (isLoading) return <Loader />
  if (isError) return <div>An error occurred: {error.message}</div>

  const { disciplines, initial_workflows, initial_pages } = data.data
  return (
    <div className="project-menu" ref={createDiv}>
      <ExploreFilter
        disciplines={disciplines}
        workflows={initial_workflows}
        pages={initial_pages}
        context="library"
      />
    </div>
  )
}

export default ExplorePage
